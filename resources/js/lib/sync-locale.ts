import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import i18n from '@/lib/i18n';

/**
 * Keeps i18next in sync with the backend's locale (Settings\LocaleController)
 * without a full page reload once the "locale" shared prop changes.
 *
 * Runs outside the Inertia component (see `withApp` in app.tsx), so it listens
 * to router navigation events instead of using `usePage()`.
 */
export function useSyncLocale(): void {
    useEffect(
        () =>
            router.on('navigate', (event) => {
                const locale = event.detail.page.props.locale as
                    | string
                    | undefined;

                if (locale && locale !== i18n.language) {
                    void i18n.changeLanguage(locale);
                    document.documentElement.lang = locale;
                }
            }),
        [],
    );
}
