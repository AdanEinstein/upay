import { Link, router } from '@inertiajs/react';
import {
    BugIcon,
    BuildingsIcon,
    CreditCardIcon,
    ListIcon,
    PulseIcon,
    SignOutIcon,
    SquaresFourIcon,
    TagIcon,
} from '@phosphor-icons/react';
import type { ComponentType, PropsWithChildren, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import AppLogoIcon from '@/components/app-logo-icon';
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
import { dashboard, logout } from '@/routes/super-admin';
import { index as billingIndex } from '@/routes/super-admin/billing';
import { index as errorsIndex } from '@/routes/super-admin/errors';
import { index as organizationsIndex } from '@/routes/super-admin/organizations';
import { index as plansIndex } from '@/routes/super-admin/plans';

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
            label: t('super:nav.dashboard'),
            href: dashboard().url,
            icon: SquaresFourIcon,
        },
        {
            label: t('super:nav.organizations'),
            href: organizationsIndex().url,
            icon: BuildingsIcon,
        },
        {
            label: t('super:nav.plans'),
            href: plansIndex().url,
            icon: TagIcon,
        },
        {
            label: t('super:nav.billing'),
            href: billingIndex().url,
            icon: CreditCardIcon,
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

    // `wrap` lets the mobile sheet close itself on navigation.
    const nav = (wrap: (link: ReactElement, key: string) => ReactElement) => (
        <nav className="flex flex-1 flex-col gap-1 px-4">
            {items.map((item) => {
                const active =
                    !item.external && isCurrentOrParentUrl(item.href);
                const className = cn(
                    'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                    active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                );
                const content = (
                    <>
                        <item.icon className="size-5" />
                        {item.label}
                    </>
                );

                return wrap(
                    item.external ? (
                        <a href={item.href} className={className}>
                            {content}
                        </a>
                    ) : (
                        <Link
                            href={item.href}
                            className={className}
                            aria-current={active ? 'page' : undefined}
                        >
                            {content}
                        </Link>
                    ),
                    item.href,
                );
            })}
        </nav>
    );

    const footer = (
        <div className="flex flex-col gap-3 border-t p-4">
            <AppearanceTabs compact />
            <Button
                variant="outline"
                className="justify-start"
                onClick={() => router.post(logout().url)}
            >
                <SignOutIcon />
                {t('common:logOut')}
            </Button>
        </div>
    );

    const brand = (
        <>
            <div className="bg-foreground text-background flex aspect-square size-8 items-center justify-center rounded-md">
                <AppLogoIcon className="size-5" />
            </div>
            <span className="truncate">{t('super:brand')}</span>
        </>
    );

    return (
        <div className="bg-background min-h-svh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
            <aside className="hidden gap-0 border-r lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col">
                <Link
                    href={dashboard()}
                    className="flex h-14 items-center gap-2 px-7 text-sm font-semibold"
                >
                    {brand}
                </Link>
                {nav((link, key) => (
                    <div key={key} className="contents">
                        {link}
                    </div>
                ))}
                {footer}
            </aside>

            <div className="min-w-0">
                <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur lg:hidden">
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
                                {nav((link, key) => (
                                    <SheetClose key={key} asChild>
                                        {link}
                                    </SheetClose>
                                ))}
                                {footer}
                            </SheetContent>
                        </Sheet>

                        <Link
                            href={dashboard()}
                            className="flex items-center gap-2 text-sm font-semibold"
                        >
                            {brand}
                        </Link>
                    </div>
                </header>
                <main className="mx-auto max-w-5xl p-4 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
