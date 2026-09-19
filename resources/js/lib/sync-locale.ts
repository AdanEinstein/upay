import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import i18n from '@/lib/i18n';

/**
 * Keeps i18next in sync with the backend's locale (Settings\LocaleController)
 * without a full page reload once the "locale" shared prop changes.
 */
export function useSyncLocale(): void {
    const { locale } = usePage<{ locale: string }>().props;

    useEffect(() => {
        if (locale && locale !== i18n.language) {
            void i18n.changeLanguage(locale);
            document.documentElement.lang = locale;
        }
    }, [locale]);
}
