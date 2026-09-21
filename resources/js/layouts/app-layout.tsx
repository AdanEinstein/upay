import { usePage } from '@inertiajs/react';
import { WifiSlashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import InstallPrompt from '@/components/install-prompt';
import MobileScreen from '@/components/mobile-screen';
import BottomNav from '@/components/shop/bottom-nav';
import PaymentClaimAlerts from '@/components/shop/payment-claim-alerts';
import { useOnline } from '@/hooks/use-online';
import { useTenant } from '@/hooks/use-tenant';
import { echoEnabled } from '@/lib/echo';
import { NAV_TABS } from '@/lib/nav-section';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

// Desktop: shadcn inset sidebar. Mobile: the dashboard's phone screen, with
// the bottom bar on tab pages and a back button everywhere else.
export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { t } = useTranslation('shop');
    const { component } = usePage();
    const online = useOnline();
    const tenant = useTenant();
    const showNav = component in NAV_TABS;

    return (
        <AppShell variant="sidebar">
            {echoEnabled && tenant && (
                <PaymentClaimAlerts organizationId={tenant.id} />
            )}
            <AppSidebar />
            <AppContent variant="sidebar" className="min-w-0 overflow-x-clip">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <MobileScreen
                    className={cn(
                        showNav ? 'pb-[100px]' : 'pb-6',
                        'lg:mx-0 lg:min-h-0 lg:max-w-[800px] lg:flex-1 lg:px-5 lg:pt-4 lg:pb-10',
                    )}
                >
                    {!online && (
                        <div className="bg-muted text-muted-foreground flex items-center gap-2 px-5 py-2 text-[12.5px] font-medium">
                            <WifiSlashIcon className="size-[15px]" />
                            {t('common.offline')}
                        </div>
                    )}
                    {children}
                    {showNav && <BottomNav active={NAV_TABS[component]} />}
                    <InstallPrompt />
                </MobileScreen>
            </AppContent>
        </AppShell>
    );
}
