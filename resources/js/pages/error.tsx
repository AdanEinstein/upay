import { Head } from '@inertiajs/react';
import {
    ClockIcon,
    HourglassIcon,
    MagnifyingGlassIcon,
    ShieldWarningIcon,
    WarningCircleIcon,
    WrenchIcon,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import MobileScreen from '@/components/mobile-screen';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type StatusMeta = {
    key: string;
    icon: Icon;
    tone: string;
    action: 'back' | 'login';
};

const warning = 'bg-amber-500/10 text-amber-600 dark:text-amber-500';

const STATUS_META: Record<number, StatusMeta> = {
    404: {
        key: 'notFound',
        icon: MagnifyingGlassIcon,
        tone: 'bg-muted text-muted-foreground',
        action: 'back',
    },
    403: {
        key: 'forbidden',
        icon: ShieldWarningIcon,
        tone: warning,
        action: 'login',
    },
    401: {
        key: 'sessionExpired',
        icon: ClockIcon,
        tone: warning,
        action: 'login',
    },
    419: {
        key: 'sessionExpired',
        icon: ClockIcon,
        tone: warning,
        action: 'login',
    },
    429: {
        key: 'tooManyRequests',
        icon: HourglassIcon,
        tone: warning,
        action: 'back',
    },
    503: {
        key: 'maintenance',
        icon: WrenchIcon,
        tone: 'bg-brand/10 text-brand',
        action: 'back',
    },
};

const DEFAULT_META: StatusMeta = {
    key: 'default',
    icon: WarningCircleIcon,
    tone: 'bg-destructive/10 text-destructive',
    action: 'back',
};

type Props = {
    status: number;
    loginUrl?: string | null;
    errorId?: number | null;
};

export default function ErrorPage({ status, loginUrl, errorId }: Props) {
    const { t } = useTranslation('errors');
    const meta = STATUS_META[status] ?? DEFAULT_META;
    const StatusIcon = meta.icon;

    return (
        <>
            <Head title={t(`${meta.key}.title`)} />

            <MobileScreen className="items-center justify-center gap-4 p-8 text-center">
                <div
                    className={cn(
                        'flex size-[72px] items-center justify-center rounded-full',
                        meta.tone,
                    )}
                >
                    <StatusIcon className="size-8" />
                </div>
                <p className="text-muted-foreground font-mono text-xs tracking-widest">
                    {t('status', { status })}
                </p>
                <h1 className="font-heading text-xl font-bold">
                    {t(`${meta.key}.title`)}
                </h1>
                <p className="text-muted-foreground max-w-xs text-sm">
                    {t(`${meta.key}.description`)}
                </p>

                <div className="mt-2 flex w-full max-w-xs flex-col gap-2.5">
                    {meta.action === 'login' && loginUrl ? (
                        <Button asChild className="h-12 text-base">
                            <a href={loginUrl}>{t('goToLogin')}</a>
                        </Button>
                    ) : (
                        <Button
                            className="h-12 text-base"
                            onClick={() => window.history.back()}
                        >
                            {t('back')}
                        </Button>
                    )}
                    {errorId != null && (
                        <p className="text-muted-foreground text-xs">
                            {t('errorId', { id: errorId })}
                        </p>
                    )}
                </div>
            </MobileScreen>
        </>
    );
}
