import i18n from '@/lib/i18n';

export function formatDate(
    date: string | Date,
    options?: Intl.DateTimeFormatOptions,
): string {
    return new Intl.DateTimeFormat(i18n.language, options).format(
        new Date(date),
    );
}

export function formatDateTime(date: string | Date): string {
    return formatDate(date, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatNumber(
    value: number,
    options?: Intl.NumberFormatOptions,
): string {
    return new Intl.NumberFormat(i18n.language, options).format(value);
}
