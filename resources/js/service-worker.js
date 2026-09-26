// Offline support for the installed app, served by ServiceWorkerController,
// which prepends VERSION (changes on every build), ASSETS (the Vite build
// files) and DEV_SERVER (the `vite dev` origin, or null). Not bundled by Vite:
// it runs in the worker scope, not the page.
//
// - /build/* assets: precached per build, served cache-first.
// - `vite dev` modules (local only): network-first, cached as they load.
// - Page loads and Inertia GET visits: network-first, falling back to the last
//   copy, so screens seen (or warmed up by lib/offline-page.ts) open offline.
// - Anything else goes to the network untouched; writes made offline are
//   queued by the page itself (lib/offline-queue.ts), not here.

/* global VERSION, ASSETS, DEV_SERVER */

const ASSET_CACHE = `assets-${VERSION}`;
const PAGE_CACHE = 'pages';
const OFFLINE_CACHE = 'offline';
const DEV_CACHE = 'dev-modules';
const USER_KEY = '/__offline-user';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(ASSET_CACHE)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    // Cached pages point at the previous build's asset hashes, so they go too.
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter(
                            (key) =>
                                key !== ASSET_CACHE && key !== OFFLINE_CACHE,
                        )
                        .map((key) => caches.delete(key)),
                ),
            )
            .then(() => self.clients.claim())
            // Pages were just dropped: ask open tabs to hand over the warm-up list again.
            .then(() => self.clients.matchAll())
            .then((clients) =>
                clients.forEach((client) =>
                    client.postMessage({ type: 'activated' }),
                ),
            ),
    );
});

self.addEventListener('message', (event) => {
    const message = event.data ?? {};

    if (message.type === 'offline-page') {
        event.waitUntil(
            caches
                .open(OFFLINE_CACHE)
                .then((cache) => cache.add(message.url))
                .catch(() => {}),
        );
    }

    if (message.type === 'prepare') {
        event.waitUntil(
            rememberUser(message.userId).then(() =>
                warm(message.urls, message.version),
            ),
        );
    }

    if (message.type === 'clear') {
        event.waitUntil(caches.delete(PAGE_CACHE));
    }
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
        return;
    }

    if (DEV_SERVER && url.origin === new URL(DEV_SERVER).origin) {
        event.respondWith(devModule(event, request));

        return;
    }

    if (url.origin !== self.location.origin) {
        return;
    }

    if (url.pathname.startsWith('/build/')) {
        event.respondWith(
            caches.match(request).then((cached) => cached ?? fetch(request)),
        );

        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            networkFirst(event, request, request.url).catch(() =>
                offlinePage(url),
            ),
        );

        return;
    }

    // Partial reloads only carry a slice of the props; caching them would
    // replace a full page with a fragment.
    if (
        request.headers.get('X-Inertia') &&
        !request.headers.get('X-Inertia-Partial-Data')
    ) {
        event.respondWith(networkFirst(event, request, inertiaKey(url)));
    }
});

async function devModule(event, request) {
    try {
        const response = await fetch(request);

        if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
                caches
                    .open(DEV_CACHE)
                    .then((cache) => cache.put(request, copy)),
            );
        }

        return response;
    } catch {
        return (
            (await caches.match(request, { cacheName: DEV_CACHE })) ??
            Response.error()
        );
    }
}

/**
 * HTML and Inertia JSON share a URL, so the JSON copy is cached under a
 * marked key (the Cache API ignores #fragments, hence a query param).
 */
function inertiaKey(url) {
    const key = new URL(url);
    key.searchParams.set('__inertia', '1');

    return key.href;
}

async function networkFirst(event, request, key) {
    try {
        const response = await fetch(request);

        // Redirects (login, plan limit) and errors are never worth replaying offline.
        if (response.ok && !response.redirected && response.type === 'basic') {
            event.waitUntil(store(key, response.clone()));
        }

        return response;
    } catch (error) {
        const cached = await caches.match(key, { cacheName: PAGE_CACHE });

        if (!cached) {
            throw error;
        }

        event.waitUntil(notify(event, cached.headers.get('X-Cached-At')));

        return cached;
    }
}

async function store(key, response) {
    const headers = new Headers(response.headers);
    headers.set('X-Cached-At', new Date().toISOString());

    const cache = await caches.open(PAGE_CACHE);
    await cache.put(
        key,
        new Response(await response.blob(), {
            status: response.status,
            statusText: response.statusText,
            headers,
        }),
    );
}

/**
 * Tells the page it is looking at a saved copy, and from when.
 */
async function notify(event, cachedAt) {
    const client = await self.clients.get(
        event.clientId || event.resultingClientId,
    );

    client?.postMessage({ type: 'cached', cachedAt });
}

async function offlinePage(url) {
    const organization = url.pathname.split('/')[1];

    return (
        (await caches.match(`/${organization}/offline`, {
            cacheName: OFFLINE_CACHE,
        })) ?? Response.error()
    );
}

/**
 * Fetches the screens as Inertia visits would, so they open offline even
 * if they were never visited. Failures (stale version, logged out) are skipped.
 */
async function warm(urls, version) {
    const pending = [...urls];

    // Three at a time: done in a few seconds, without flooding the server on
    // every app open.
    await Promise.all(
        [1, 2, 3].map(async () => {
            while (pending.length > 0) {
                await warmOne(pending.shift(), version);
            }
        }),
    );
}

async function warmOne(path, version) {
    const url = new URL(path, self.location.origin);
    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: {
            Accept: 'text/html, application/xhtml+xml',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Inertia': 'true',
            'X-Inertia-Version': version ?? '',
        },
    }).catch(() => null);

    if (response?.ok && !response.redirected) {
        await store(inertiaKey(url), response);
    }
}

/**
 * Pages cached for one user must never show up for another on a shared phone.
 */
async function rememberUser(id) {
    const cache = await caches.open(OFFLINE_CACHE);
    const previous = await cache
        .match(USER_KEY)
        .then((response) => response?.text());

    if (previous !== undefined && previous !== String(id)) {
        await caches.delete(PAGE_CACHE);
    }

    await cache.put(USER_KEY, new Response(String(id)));
}
