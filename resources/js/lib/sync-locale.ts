import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import i18n from '@/lib/i18n';

/**
 * Keeps i18next in sync with the backend's locale (Settings\LocaleController)
 * without a full page reload once the "locale" shared prop changes.
 *
 * Runs outside the Inertia component (see `withApp` in app.tsx), so it listens
 * to router events instead of using `usePage()`.
 */
export function useSyncLocale(): void {
    useEffect(() => {
        const sync = (page: { props: Record<string, unknown> }) => {
            const locale = page.props.locale as string | undefined;

            if (locale && locale !== i18n.language) {
                void i18n.changeLanguage(locale);
                document.documentElement.lang = locale;
            }
        };

        // "navigate" is skipped for `replace` visits (a PUT redirecting back
        // to the same URL), so "success" is needed to catch those too.
        const offNavigate = router.on('navigate', (event) =>
            sync(event.detail.page),
        );
        const offSuccess = router.on('success', (event) =>
            sync(event.detail.page),
        );

        return () => {
            offNavigate();
            offSuccess();
        };
    }, []);
}
