import type { NavTab } from '@/components/shop/bottom-nav';

export type NavSection =
    | 'home'
    | 'sales'
    | 'customers'
    | 'products'
    | 'catalog'
    | 'finance'
    | 'settings';

// Pages that show the bottom bar, and which tab they highlight. Detail and
// form pages are absent on purpose: they get a back button instead.
export const NAV_TABS: Record<string, NavTab> = {
    home: 'home',
    'sales/index': 'sales',
    receivables: 'sales',
    'customers/index': 'customers',
    'products/index': 'products',
    finance: 'home',
    more: 'home',
    'catalog/show': 'home',
};

// Desktop sidebar section per page family, detail and form pages included.
const SECTIONS: Record<string, NavSection> = {
    home: 'home',
    sales: 'sales',
    receivables: 'sales',
    customers: 'customers',
    products: 'products',
    catalog: 'catalog',
    promotions: 'catalog',
    finance: 'finance',
    expenses: 'finance',
    payables: 'finance',
    more: 'settings',
    billing: 'settings',
    'pix-key': 'settings',
    settings: 'settings',
    admin: 'settings',
};

export function sectionOf(component: string): NavSection | null {
    return SECTIONS[component.split('/')[0]] ?? null;
}
