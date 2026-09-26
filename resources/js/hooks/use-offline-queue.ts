import { usePage } from '@inertiajs/react';
import { useMemo, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    enqueueAction,
    queuedActions,
    subscribeToQueue,
} from '@/lib/offline-queue';
import type { QueuedAction } from '@/lib/offline-queue';

const NONE: QueuedAction[] = [];

/**
 * The logged-in user's actions waiting to be sent (or rejected on sending).
 */
export function useOfflineQueue(): QueuedAction[] {
    const userId = usePage().props.auth.user.id;
    const all = useSyncExternalStore(
        subscribeToQueue,
        queuedActions,
        () => NONE,
    );

    return useMemo(
        () => all.filter((action) => action.userId === userId),
        [all, userId],
    );
}

/**
 * Offline, stores the action to be sent later and returns true, so the caller
 * skips its normal submit and just closes the form. Online, returns false.
 */
export function useQueueWhenOffline(): (
    action: Pick<QueuedAction, 'method' | 'url' | 'data' | 'label'>,
) => boolean {
    const { t } = useTranslation('shop');
    const userId = usePage().props.auth.user.id;

    return (action) => {
        if (navigator.onLine) {
            return false;
        }

        void enqueueAction({ ...action, userId }).then(() =>
            toast.success(t('offline.queued')),
        );

        return true;
    };
}
