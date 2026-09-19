import { createInertiaApp } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import SuperAdminLayout from '@/layouts/super-admin-layout';
import { initializeI18n } from '@/lib/i18n';
import { currentOrganization } from '@/lib/organization';
import { useSyncLocale } from '@/lib/sync-locale';
import { setUrlDefaults } from '@/wayfinder';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Every generated route helper under `/{organization}/...` picks up the
// current tenant slug automatically, so pages never need to pass it manually.
setUrlDefaults(() => ({ organization: currentOrganization() }));

// Read the locale the backend already resolved for this request (see
// HandleInertiaRequests) directly off the initial page payload, so i18next
// starts in the right language before the app ever paints.
function readInitialLocale(): string {
    try {
        const page = document.getElementById('app')?.dataset.page;

        return page ? (JSON.parse(page).props.locale ?? 'pt-BR') : 'pt-BR';
    } catch {
        return 'pt-BR';
    }
}

initializeI18n(readInitialLocale());

function AppProviders({ children }: { children: ReactNode }) {
    useSyncLocale();

    return (
        <TooltipProvider delayDuration={0}>
            {children}
            <Toaster />
        </TooltipProvider>
    );
}

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name.startsWith('public/'):
                return null;
            case name === 'super-admin/login':
                return AuthLayout;
            case name.startsWith('super/'):
                return SuperAdminLayout;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return <AppProviders>{app}</AppProviders>;
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
