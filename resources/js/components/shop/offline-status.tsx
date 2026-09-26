import { router, usePage } from '@inertiajs/react';
import {
    SpinnerGapIcon,
    WarningCircleIcon,
    WifiSlashIcon,
} from '@phosphor-icons/react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import BottomSheet from '@/components/shop/bottom-sheet';
import { Button } from '@/components/ui/button';
import { useFormat } from '@/hooks/use-format';
import { useOfflineQueue } from '@/hooks/use-offline-queue';
import { useOnline } from '@/hooks/use-online';
import {
    clearOfflinePages,
    offlineCachedAt,
    prepareOfflinePages,
    subscribeToCachedAt,
} from '@/lib/offline-page';
import {
    discardAction,
    discardActionsOf,
    flushQueue,
    retryAction,
} from '@/lib/offline-queue';
import { cn } from '@/lib/utils';

/**
 * The connection banner and everything behind it: sends queued actions when
 * the connection is back, lists what is pending or was rejected, keeps
 * changes that can't be queued from being submitted offline, explains
 * screens that weren't saved, and clears the saved screens on logout.
 */
export default function OfflineStatus() {
    const { t } = useTranslation('shop');
    const { time } = useFormat();
    const page = usePage();
    const userId = page.props.auth.user.id;
    const online = useOnline();
    const actions = useOfflineQueue();
    const cachedAt = useSyncExternalStore(
        subscribeToCachedAt,
        offlineCachedAt,
        () => null,
    );
    const [open, setOpen] = useState(false);

    const failed = actions.filter((action) => action.error).length;
    const pending = actions.length - failed;

    function send() {
        void flushQueue(userId, {
            rejected: t('offline.rejected'),
            planLimit: t('offline.planLimit'),
        }).then(({ result, sent }) => {
            if (sent > 0) {
                toast.success(t('offline.sent', { count: sent }));
                router.reload();
            }

            if (result === 'unauthenticated') {
                toast.error(t('offline.loginAgain'));
            }
        });
    }

    useEffect(() => {
        if (!online) {
            return;
        }

        send();
        const timer = setTimeout(
            () => prepareOfflinePages(userId, page.version),
            2000,
        );
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                send();
            }
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- send on reconnect/user change only
    }, [online, userId]);

    useEffect(
        () =>
            router.on('before', (event) => {
                const { method, url } = event.detail.visit;

                if (method === 'get') {
                    return;
                }

                // Queueable actions never reach here offline (see useQueueWhenOffline).
                if (!navigator.onLine) {
                    toast.error(t('offline.needsConnection'));

                    return false;
                }

                if (url.pathname.endsWith('/logout')) {
                    if (
                        actions.length > 0 &&
                        !window.confirm(
                            t('offline.logoutConfirm', {
                                count: actions.length,
                            }),
                        )
                    ) {
                        return false;
                    }

                    void discardActionsOf(userId);
                    clearOfflinePages();
                }
            }),
        [actions.length, t, userId],
    );

    // Offline, a visit only fails when that screen was never saved.
    useEffect(
        () =>
            router.on('networkError', () => {
                if (!navigator.onLine) {
                    toast.error(t('offline.notSaved'));

                    return false;
                }
            }),
        [t],
    );

    if (online && actions.length === 0) {
        return null;
    }

    const tone = !online
        ? 'bg-muted text-muted-foreground'
        : failed > 0
          ? 'bg-destructive/15 text-destructive'
          : 'bg-brand-soft text-brand';

    let message: string;

    if (!online) {
        message = cachedAt
            ? t('offline.bannerSince', { time: time(cachedAt) })
            : t('offline.banner');

        if (actions.length > 0) {
            message += ` · ${t('offline.queuedCount', { count: actions.length })}`;
        }
    } else if (pending > 0) {
        message = t('offline.sending', { count: pending });
    } else {
        message = t('offline.failed', { count: failed });
    }

    const Icon = !online
        ? WifiSlashIcon
        : failed > 0 && pending === 0
          ? WarningCircleIcon
          : SpinnerGapIcon;

    return (
        <>
            <button
                type="button"
                disabled={actions.length === 0}
                onClick={() => setOpen(true)}
                className={cn(
                    'flex w-full items-center gap-2 px-5 py-2 text-left text-[12.5px] font-medium disabled:cursor-default',
                    tone,
                )}
            >
                <Icon
                    className={cn(
                        'size-[15px] shrink-0',
                        Icon === SpinnerGapIcon &&
                            'animate-spin motion-reduce:animate-none',
                    )}
                />
                <span className="min-w-0 flex-1">{message}</span>
                {actions.length > 0 && (
                    <span className="underline underline-offset-2">
                        {t('offline.view')}
                    </span>
                )}
            </button>

            <BottomSheet
                open={open && actions.length > 0}
                onOpenChange={setOpen}
                title={t('offline.sheetTitle')}
                description={t('offline.sheetDescription')}
            >
                <ul className="flex flex-col gap-2.5">
                    {actions.map((action) => (
                        <li
                            key={action.id}
                            className="border-border flex flex-col gap-2 rounded-xl border px-3 py-2.5"
                        >
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="min-w-0 truncate text-[13.5px] font-medium">
                                    {action.label}
                                </p>
                                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                                    {time(action.createdAt)}
                                </span>
                            </div>
                            {action.error ? (
                                <p className="text-destructive text-xs">
                                    {action.error}
                                </p>
                            ) : (
                                <p className="text-muted-foreground text-xs">
                                    {t('offline.waiting')}
                                </p>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        void discardAction(action.id)
                                    }
                                >
                                    {t('offline.discard')}
                                </Button>
                                {action.error && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!online}
                                        onClick={() =>
                                            void retryAction(action.id).then(
                                                send,
                                            )
                                        }
                                    >
                                        {t('offline.retry')}
                                    </Button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </BottomSheet>
        </>
    );
}
