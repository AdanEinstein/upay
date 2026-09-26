import { useTranslation } from 'react-i18next';
import { formatDate, formatMoney, formatShortDate } from '@/lib/money';

// `i18n.language` can be a locale without resources (e.g. `en`); the resolved
// one is what the UI actually renders in.
export function useFormat() {
    const { i18n } = useTranslation();
    const locale = i18n.resolvedLanguage;

    return {
        money: (cents: number) => formatMoney(cents, locale),
        shortDate: (isoDate: string) => formatShortDate(isoDate, locale),
        date: (isoDate: string) => formatDate(isoDate, locale),
        time: (isoDateTime: string) =>
            new Date(isoDateTime).toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit',
            }),
    };
}
