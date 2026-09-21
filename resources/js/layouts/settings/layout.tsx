import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import Heading from '@/components/heading';
import PageHeader from '@/components/shop/page-header';
import { Button } from '@/components/ui/button';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editLocale } from '@/routes/locale';
import { show as more } from '@/routes/more';
import { edit as editOrganization } from '@/routes/organization-settings';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { t } = useTranslation('settings');
    const { isCurrentOrParentUrl } = useCurrentUrl();

    const sidebarNavItems: NavItem[] = [
        {
            title: t('settings:nav.shop'),
            href: editOrganization(),
            icon: null,
        },
        {
            title: t('settings:nav.profile'),
            href: edit(),
            icon: null,
        },
        {
            title: t('settings:nav.security'),
            href: editSecurity(),
            icon: null,
        },
        {
            title: t('settings:nav.appearance'),
            href: editAppearance(),
            icon: null,
        },
        {
            title: t('settings:nav.language'),
            href: editLocale(),
            icon: null,
        },
    ];

    const current = sidebarNavItems.find((item) =>
        isCurrentOrParentUrl(item.href),
    );

    return (
        <div className="lg:px-4 lg:py-6">
            <div className="lg:hidden">
                <PageHeader
                    title={current?.title ?? t('settings:title')}
                    back={more.url()}
                />
            </div>

            <div className="hidden lg:block">
                <Heading
                    title={t('settings:title')}
                    description={t('settings:description')}
                />
            </div>

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="hidden w-full max-w-xl lg:block lg:w-48">
                    <nav
                        className="flex flex-col space-y-1 space-x-0"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': isCurrentOrParentUrl(item.href),
                                })}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <div className="flex-1 px-5 pt-2 lg:max-w-2xl lg:px-0 lg:pt-0">
                    <section className="max-w-xl space-y-12">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
