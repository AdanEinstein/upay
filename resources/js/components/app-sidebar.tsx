import { Link, usePage } from '@inertiajs/react';
import {
    Eye,
    Home,
    Package,
    Plus,
    Settings,
    ShoppingBag,
    Users,
    Wallet,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavSection } from '@/lib/nav-section';
import { sectionOf } from '@/lib/nav-section';
import { dashboard } from '@/routes';
import { show as catalog } from '@/routes/catalog';
import { index as customers } from '@/routes/customers';
import { index as finance } from '@/routes/finance';
import { show as more } from '@/routes/more';
import { index as products } from '@/routes/products';
import { create as createSale, index as sales } from '@/routes/sales';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { t } = useTranslation('shop');
    const { component } = usePage();
    const section = sectionOf(component);

    const items: (NavItem & { section: NavSection })[] = [
        { section: 'home', title: t('nav.home'), href: dashboard(), icon: Home },
        { section: 'sales', title: t('nav.sales'), href: sales(), icon: ShoppingBag },
        { section: 'customers', title: t('nav.customers'), href: customers(), icon: Users },
        { section: 'products', title: t('nav.products'), href: products(), icon: Package },
        { section: 'catalog', title: t('nav.catalog'), href: catalog(), icon: Eye },
        { section: 'finance', title: t('nav.finance'), href: finance(), icon: Wallet },
        { section: 'settings', title: t('nav.settings'), href: more(), icon: Settings },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain
                    items={items.map((item) => ({
                        ...item,
                        isActive: item.section === section,
                    }))}
                />
            </SidebarContent>

            <SidebarFooter>
                <Button asChild className="w-full gap-1.5 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0">
                    <Link href={createSale()} aria-label={t('nav.newSale')}>
                        <Plus className="size-4" />
                        <span className="group-data-[collapsible=icon]:hidden">
                            {t('nav.newSale')}
                        </span>
                    </Link>
                </Button>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
