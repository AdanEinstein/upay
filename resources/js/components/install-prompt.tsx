import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLogoIcon from '@/components/app-logo-icon';
import { brandScope } from '@/components/mobile-screen';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { currentOrganization } from '@/lib/organization';
import { cn } from '@/lib/utils';
import { appManifest } from '@/routes';

type InstallEvent = Event & { prompt: () => Promise<unknown> };

const SNOOZE_KEY = 'upay:install-snoozed-until';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const READY_EVENT = 'upay:install-ready';

// The browser fires `beforeinstallprompt` once, early — before this component
// mounts on a later Inertia page — so capture it at module load.
let deferred: InstallEvent | null = null;

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferred = event as InstallEvent;
        window.dispatchEvent(new Event(READY_EVENT));
    });
}

// Inertia visits keep the <head> of the first page load, so the manifest the
// browser would install may belong to another page. Only offer the install
// when it is this organization's, which scopes the app to the store.
function linksOrganizationManifest(): boolean {
    const organization = currentOrganization();
    const href = document.querySelector<HTMLLinkElement>(
        'link[rel="manifest"]',
    )?.href;

    return (
        organization !== '' &&
        href !== undefined &&
        new URL(href).pathname === appManifest.url({ organization })
    );
}

function isSnoozed(): boolean {
    try {
        return Number(localStorage.getItem(SNOOZE_KEY)) > Date.now();
    } catch {
        return false;
    }
}

export default function InstallPrompt() {
    const { t } = useTranslation('common');
    const isMobile = useIsMobile();
    const [event, setEvent] = useState<InstallEvent | null>(null);

    useEffect(() => {
        const sync = () =>
            setEvent(
                isSnoozed() || !linksOrganizationManifest() ? null : deferred,
            );

        sync();
        window.addEventListener(READY_EVENT, sync);

        return () => window.removeEventListener(READY_EVENT, sync);
    }, []);

    function dismiss() {
        try {
            localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
        } catch {
            // Storage blocked: the sheet just comes back next visit.
        }

        setEvent(null);
    }

    async function install() {
        await event?.prompt();
        deferred = null;
        setEvent(null);
    }

    return (
        <Sheet
            open={isMobile && event !== null}
            onOpenChange={(open) => !open && dismiss()}
        >
            <SheetContent
                side="bottom"
                showCloseButton={false}
                className={cn(
                    'items-center gap-4 rounded-t-3xl px-6 pt-7 pb-8 text-center',
                    brandScope,
                )}
            >
                <div className="bg-brand text-brand-foreground flex size-16 items-center justify-center rounded-2xl">
                    <AppLogoIcon className="size-9" />
                </div>
                <SheetHeader className="p-0 text-center">
                    <SheetTitle className="font-heading text-lg font-bold">
                        {t('installApp.title', { name: 'Upay' })}
                    </SheetTitle>
                    <SheetDescription>
                        {t('installApp.description')}
                    </SheetDescription>
                </SheetHeader>
                <div className="flex w-full flex-col gap-2.5">
                    <Button className="h-12 text-base" onClick={install}>
                        {t('installApp.install')}
                    </Button>
                    <Button variant="ghost" className="h-10" onClick={dismiss}>
                        {t('installApp.notNow')}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
