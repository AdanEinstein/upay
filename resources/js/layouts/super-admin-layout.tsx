import { Link, router } from '@inertiajs/react';
import {
    BugIcon,
    BuildingsIcon,
    ListIcon,
    PulseIcon,
    SignOutIcon,
} from '@phosphor-icons/react';
import type { ComponentType, PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import AppearanceTabs from '@/components/appearance-tabs';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { logout } from '@/routes/super-admin';
import { index as errorsIndex } from '@/routes/super-admin/errors';
import { index as organizationsIndex } from '@/routes/super-admin/organizations';

type NavEntry = {
    label: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    // Pulse is a Blade page outside Inertia: needs a full page load.
    external?: boolean;
};

export default function SuperAdminLayout({ children }: PropsWithChildren) {
    const { t } = useTranslation(['super', 'common']);
    const { isCurrentOrParentUrl } = useCurrentUrl();

    const items: NavEntry[] = [
        {
            label: t('super:nav.organizations'),
            href: organizationsIndex().url,
            icon: BuildingsIcon,
        },
        {
            label: t('super:nav.errors'),
            href: errorsIndex().url,
            icon: BugIcon,
        },
        {
            label: t('super:nav.pulse'),
            href: '/super-admin/pulse',
            icon: PulseIcon,
            external: true,
        },
    ];

    return (
        <div className="bg-background min-h-svh">
            <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
                <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('super:nav.menu')}
                            >
                                <ListIcon className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="gap-0">
                            <SheetHeader>
                                <SheetTitle>{t('super:brand')}</SheetTitle>
                                <SheetDescription>
                                    {t('super:nav.menuDescription')}
                                </SheetDescription>
                            </SheetHeader>

                            <nav className="flex flex-1 flex-col gap-1 px-4">
                                {items.map((item) => {
                                    const active =
                                        !item.external &&
                                        isCurrentOrParentUrl(item.href);
                                    const className = cn(
                                        'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                                        active
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    );

                                    return (
                                        <SheetClose key={item.href} asChild>
                                            {item.external ? (
                                                <a
                                                    href={item.href}
                                                    className={className}
                                                >
                                                    <item.icon className="size-5" />
                                                    {item.label}
                                                </a>
                                            ) : (
                                                <Link
                                                    href={item.href}
                                                    className={className}
                                                    aria-current={
                                                        active
                                                            ? 'page'
                                                            : undefined
                                                    }
                                                >
                                                    <item.icon className="size-5" />
                                                    {item.label}
                                                </Link>
                                            )}
                                        </SheetClose>
                                    );
                                })}
                            </nav>

                            <div className="flex flex-col gap-3 border-t p-4">
                                <AppearanceTabs className="self-start" />
                                <Button
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => router.post(logout().url)}
                                >
                                    <SignOutIcon />
                                    {t('common:logOut')}
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Link href={organizationsIndex()} className="font-semibold">
                        {t('super:brand')}
                    </Link>
                </div>
            </header>
            <main className="mx-auto max-w-5xl p-4">{children}</main>
        </div>
    );
}
