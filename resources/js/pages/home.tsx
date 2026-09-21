import { Head, Link } from '@inertiajs/react';
import {
    BagIcon,
    ChartLineUpIcon,
    DotsThreeCircleIcon,
    StorefrontIcon,
    WarningIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/shop/empty-state';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useFormat } from '@/hooks/use-format';
import { useTenant } from '@/hooks/use-tenant';
import { cn } from '@/lib/utils';
import { publicDebtUrl, whatsappUrl } from '@/lib/whatsapp';
import { show as catalog } from '@/routes/catalog';
import { index as finance } from '@/routes/finance';
import { show as more } from '@/routes/more';
import { create as createSale } from '@/routes/sales';

type Props = {
    hasSales: boolean;
    salesTodayCents: number;
    monthProfitCents: number;
    receivableTodayCents: number;
    receivableOverdueCents: number;
    lowStock: { id: number; name: string; quantity: number }[];
    dueToday: {
        id: number;
        customer: string;
        phone: string | null;
        publicToken: string;
        amountCents: number;
    }[];
};

function Stat({
    label,
    value,
    danger,
}: {
    label: string;
    value: string;
    danger?: boolean;
}) {
    return (
        <div className="bg-card border-border rounded-2xl border p-3">
            <p className="text-muted-foreground mb-1 text-xs">{label}</p>
            <p
                className={cn(
                    'text-lg font-bold',
                    danger && 'text-destructive',
                )}
            >
                {value}
            </p>
        </div>
    );
}

export default function Home({
    hasSales,
    salesTodayCents,
    monthProfitCents,
    receivableTodayCents,
    receivableOverdueCents,
    lowStock,
    dueToday,
}: Props) {
    const { t } = useTranslation('shop');
    const { money } = useFormat();
    const tenant = useTenant();

    const shortcuts = [
        { icon: ChartLineUpIcon, label: 'home.shortcuts.finance', href: finance.url() },
        { icon: StorefrontIcon, label: 'home.shortcuts.catalog', href: catalog.url() },
        { icon: DotsThreeCircleIcon, label: 'home.shortcuts.more', href: more.url() },
    ];

    return (
        <>
            <Head title={t('nav.home')} />

            {!hasSales ? (
                <EmptyState
                    icon={<BagIcon />}
                    title={t('home.empty.title')}
                    description={t('home.empty.description')}
                >
                    <Button asChild size="lg" className="h-12 px-6 text-[15px]">
                        <Link href={createSale.url()}>
                            {t('home.empty.action')}
                        </Link>
                    </Button>
                </EmptyState>
            ) : (
                <div className="flex flex-col gap-[18px] px-5 pt-5">
                    <div>
                        <h1 className="font-heading text-xl font-bold">
                            {t('home.greeting', { name: tenant?.name })}
                        </h1>
                        <p className="text-muted-foreground text-[13px]">
                            {t('home.subtitle')}
                        </p>
                    </div>

                    <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                        {shortcuts.map(({ icon: Icon, label, href }) => (
                            <Link
                                key={label}
                                href={href}
                                className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap"
                            >
                                <Icon className="size-4" />
                                {t(label)}
                            </Link>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Stat label={t('home.salesToday')} value={money(salesTodayCents)} />
                        <Stat label={t('home.monthProfit')} value={money(monthProfitCents)} />
                        <Stat label={t('home.receivableToday')} value={money(receivableTodayCents)} />
                        <Stat
                            label={t('home.receivableOverdue')}
                            value={money(receivableOverdueCents)}
                            danger={receivableOverdueCents > 0}
                        />
                    </div>

                    {lowStock.length > 0 && (
                        <Alert>
                            <WarningIcon />
                            <AlertTitle>{t('home.lowStock')}</AlertTitle>
                            <AlertDescription>
                                {lowStock.map((item) => (
                                    <span key={item.id} className="block">
                                        {t('home.lowStockItem', {
                                            name: item.name,
                                            count: item.quantity,
                                        })}
                                    </span>
                                ))}
                            </AlertDescription>
                        </Alert>
                    )}

                    {dueToday.length > 0 && (
                        <section className="flex flex-col gap-2">
                            <h2 className="text-sm font-semibold">
                                {t('home.dueTodayTitle')}
                            </h2>
                            <div className="border-border divide-border divide-y overflow-hidden rounded-2xl border">
                                {dueToday.map((item) => (
                                    <div key={item.id} className="flex items-center gap-2.5 p-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {item.customer}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {t('status.dueToday')}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {money(item.amountCents)}
                                        </span>
                                        <Button asChild size="sm" variant="outline">
                                            <a
                                                href={whatsappUrl(
                                                    item.phone,
                                                    t('home.chargeMessage', {
                                                        name: item.customer,
                                                        amount: money(item.amountCents),
                                                        link: publicDebtUrl(item.publicToken),
                                                    }),
                                                )}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {t('home.charge')}
                                            </a>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </>
    );
}
