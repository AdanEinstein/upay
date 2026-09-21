import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import type { Tenant } from '@/hooks/use-tenant';

/**
 * Mirrors the tenant brand colors onto <html> after every navigation, so
 * saving Organization settings repaints the app without a full page reload.
 * The first paint is still done server-side by resources/views/app.blade.php.
 */
export function useSyncTenantTheme(): void {
    useEffect(() => {
        const sync = (page: { props: Record<string, unknown> }) => {
            const tenant = page.props.tenant as Tenant | null | undefined;

            if (!tenant) {
                return;
            }

            const style = document.documentElement.style;

            style.setProperty('--tenant-primary', tenant.accentColor);
            style.setProperty(
                '--tenant-primary-hover',
                tenant.accentColorHover,
            );
            style.setProperty('--tenant-primary-soft', tenant.accentColorSoft);
            style.setProperty('--tenant-on-primary', tenant.onPrimaryColor);
            document
                .querySelector('meta[name="theme-color"]')
                ?.setAttribute('content', tenant.accentColor);
        };

        // "success" also covers `replace` visits, which skip "navigate".
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
