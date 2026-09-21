export const NOTICE_STYLES = {
    info: 'bg-brand-soft text-brand',
    warning: 'bg-chart-4/20 text-chart-4',
    urgent: 'bg-destructive/15 text-destructive',
} as const;

export type NoticeType = keyof typeof NOTICE_STYLES;
