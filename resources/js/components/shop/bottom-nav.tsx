import { Link } from '@inertiajs/react';
import {
    BagIcon,
    HouseIcon,
    PackageIcon,
    PlusIcon,
    ReceiptIcon,
    UserPlusIcon,
    UsersIcon,
    CurrencyCircleDollarIcon,
} from '@phosphor-icons/react';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@/components/shop/bottom-sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { create as createCustomer, index as customers } from '@/routes/customers';
import { create as createExpense } from '@/routes/expenses';
import { index as products } from '@/routes/products';
import { create as createSale, index as sales } from '@/routes/sales';

export type NavTab = 'home' | 'sales' | 'customers' | 'products' | null;

const TABS = [
    { key: 'home', icon: HouseIcon, label: 'nav.home', href: () => dashboard.url(), column: 'col-start-1' },
    { key: 'sales', icon: BagIcon, label: 'nav.sales', href: () => sales.url(), column: 'col-start-2' },
    { key: 'customers', icon: UsersIcon, label: 'nav.customers', href: () => customers.url(), column: 'col-start-4' },
    { key: 'products', icon: PackageIcon, label: 'nav.products', href: () => products.url(), column: 'col-start-5' },
] as const satisfies readonly {
    key: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    href: () => string;
    column: string;
}[];

export default function BottomNav({ active }: { active: NavTab }) {
    const { t } = useTranslation('shop');
    const [open, setOpen] = useState(false);

    const actions = [
        { icon: ReceiptIcon, label: 'nav.quick.sale', href: createSale.url() },
        { icon: CurrencyCircleDollarIcon, label: 'nav.quick.expense', href: createExpense.url() },
        { icon: UserPlusIcon, label: 'nav.quick.customer', href: createCustomer.url() },
    ];

    return (
        <>
            <nav className="bg-card border-border fixed inset-x-0 bottom-0 z-30 mx-auto h-[84px] max-w-md border-t pb-[env(safe-area-inset-bottom)]">
                <div className="grid h-full grid-cols-5 items-start pt-2">
                    {TABS.map(({ key, icon: Icon, label, href, column }) => (
                        <Link
                            key={key}
                            href={href()}
                            aria-current={active === key ? 'page' : undefined}
                            className={cn(
                                'flex flex-col items-center gap-[3px] text-[11px]',
                                column,
                                active === key ? 'text-brand font-semibold' : 'text-muted-foreground font-medium',
                            )}
                        >
                            <Icon className="size-[22px]" weight={active === key ? 'fill' : 'regular'} />
                            {t(label)}
                        </Link>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label={t('nav.newSale')}
                    className="bg-brand text-brand-foreground absolute -top-[22px] left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-full shadow-lg"
                >
                    <PlusIcon className="size-6" weight="bold" />
                </button>
            </nav>

            <BottomSheet
                open={open}
                onOpenChange={setOpen}
                title={t('nav.quick.title')}
                description={t('nav.quick.description')}
            >
                {actions.map(({ icon: Icon, label, href }) => (
                    <Button
                        key={label}
                        asChild
                        variant="outline"
                        className="h-12 justify-start gap-2.5 text-[15px]"
                    >
                        <Link href={href} onClick={() => setOpen(false)}>
                            <Icon className="size-[18px]" />
                            {t(label)}
                        </Link>
                    </Button>
                ))}
            </BottomSheet>
        </>
    );
}
