// Actions taken without a connection (new sale, payment, paid expense,
// customer, stock) are kept in IndexedDB and sent, in order, once the
// connection is back. Each one carries an Idempotency-Key, so a resend after
// a lost response never runs twice (see App\Http\Middleware\IdempotentRequest),
// and the time it happened, so the server dates it right (`occurred_at`).
//
// Items belong to the user who created them and are only ever sent under
// that user's session.

import { xsrfToken } from '@/lib/echo';

export type QueuedAction = {
    id: string;
    userId: number;
    method: 'post' | 'put';
    url: string;
    data: Record<string, unknown>;
    label: string;
    createdAt: string;
    error?: string;
};

export type FlushResult = 'done' | 'offline' | 'unauthenticated';

const DB_NAME = 'upay-offline';
const STORE = 'queue';

let database: Promise<IDBDatabase> | null = null;
let actions: QueuedAction[] = [];
const listeners = new Set<() => void>();
// Other tabs of the app share the queue; tell them when it changes.
const channel =
    typeof BroadcastChannel === 'undefined'
        ? null
        : new BroadcastChannel('upay-offline-queue');

channel?.addEventListener('message', () => void refresh());

function open(): Promise<IDBDatabase> {
    database ??= new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = () =>
            request.result.createObjectStore(STORE, { keyPath: 'id' });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return database;
}

async function run<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
    const store = (await open()).transaction(STORE, mode).objectStore(STORE);

    return new Promise((resolve, reject) => {
        const request = operation(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function refresh(): Promise<void> {
    const all = await run<QueuedAction[]>('readonly', (store) =>
        store.getAll(),
    );

    actions = all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    listeners.forEach((listener) => listener());
}

async function changed(): Promise<void> {
    await refresh();
    channel?.postMessage('changed');
}

export function subscribeToQueue(listener: () => void): () => void {
    listeners.add(listener);

    if (listeners.size === 1) {
        void refresh();
    }

    return () => listeners.delete(listener);
}

export function queuedActions(): QueuedAction[] {
    return actions;
}

export async function enqueueAction(
    action: Omit<QueuedAction, 'id' | 'createdAt'>,
): Promise<void> {
    await run('readwrite', (store) =>
        store.put({
            ...action,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        }),
    );
    await changed();
}

export async function discardAction(id: string): Promise<void> {
    await run('readwrite', (store) => store.delete(id));
    await changed();
}

export async function discardActionsOf(userId: number): Promise<void> {
    await Promise.all(
        actions
            .filter((action) => action.userId === userId)
            .map((action) =>
                run('readwrite', (store) => store.delete(action.id)),
            ),
    );
    await changed();
}

export async function retryAction(id: string): Promise<void> {
    const action = actions.find((item) => item.id === id);

    if (action) {
        await run('readwrite', (store) =>
            store.put({ ...action, error: undefined }),
        );
        await changed();
    }
}

let flushing: Promise<{ result: FlushResult; sent: number }> | null = null;

/**
 * Sends the user's pending actions one at a time, oldest first. Stops at the
 * first network failure or expired session and leaves the rest queued.
 * Rejected ones (validation, plan limit) stay in the list with the reason.
 */
export function flushQueue(
    userId: number,
    messages: { rejected: string; planLimit: string },
): Promise<{ result: FlushResult; sent: number }> {
    flushing ??= (async () => {
        await refresh();
        let sent = 0;

        for (const action of actions) {
            if (action.userId !== userId || action.error) {
                continue;
            }

            let response: Response;

            try {
                response = await fetch(action.url, {
                    method: action.method.toUpperCase(),
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': xsrfToken(),
                        'Idempotency-Key': action.id,
                    },
                    body: JSON.stringify({
                        ...action.data,
                        occurred_at: action.createdAt,
                    }),
                });
            } catch {
                return { result: 'offline' as const, sent };
            }

            if (response.status === 401 || response.status === 419) {
                return { result: 'unauthenticated' as const, sent };
            }

            // Busy (same key still running elsewhere) or server trouble: try again later.
            if (response.status === 409 || response.status >= 500) {
                return { result: 'offline' as const, sent };
            }

            if (
                response.ok &&
                !new URL(response.url).pathname.endsWith('/plan-limit')
            ) {
                await run('readwrite', (store) => store.delete(action.id));
                sent++;
                continue;
            }

            const body = await response.json().catch(() => null);
            const firstError = body?.errors
                ? (Object.values(
                      body.errors as Record<string, string[]>,
                  )[0]?.[0] ?? null)
                : null;
            const error = response.ok
                ? messages.planLimit
                : (firstError ?? body?.message ?? messages.rejected);

            await run('readwrite', (store) => store.put({ ...action, error }));
        }

        return { result: 'done' as const, sent };
    })().finally(() => {
        flushing = null;
        void changed();
    });

    return flushing;
}
