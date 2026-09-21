import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type SettlementStatus =
    | 'paid'
    | 'overdue'
    | 'due_today'
    | 'upcoming'
    | 'cancelled';

const KEYS: Record<SettlementStatus, string> = {
    paid: 'status.paid',
    overdue: 'status.overdue',
    due_today: 'status.dueToday',
    upcoming: 'status.upcoming',
    cancelled: 'status.cancelled',
};

const STYLES: Record<SettlementStatus, string> = {
    paid: 'bg-brand-soft text-brand',
    overdue: 'bg-destructive/15 text-destructive',
    due_today: 'bg-chart-4/20 text-chart-4',
    upcoming: 'bg-muted text-muted-foreground',
    cancelled: 'bg-muted text-muted-foreground',
};

export function StatusBadge({ status }: { status: SettlementStatus }) {
    const { t } = useTranslation('shop');

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                STYLES[status],
            )}
        >
            {t(KEYS[status])}
        </span>
    );
}

// "Venceu 15/09", "Vence hoje", "Pago em 05/09"...
export function useDueLabel() {
    const { t } = useTranslation('shop');

    return (
        status: SettlementStatus,
        date: string | null,
        shortDate: (d: string) => string,
    ) => {
        switch (status) {
            case 'overdue':
                return t('dueLabel.overdue', { date: shortDate(date!) });
            case 'due_today':
                return t('dueLabel.dueToday');
            case 'upcoming':
                return t('dueLabel.upcoming', { date: shortDate(date!) });
            case 'paid':
                return date
                    ? t('dueLabel.paid', { date: shortDate(date) })
                    : t('dueLabel.paidNoDate');
            default:
                return t('dueLabel.cancelled');
        }
    };
}
