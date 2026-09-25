import { Head, Link } from '@inertiajs/react';
import {
    BagIcon,
    ChartLineUpIcon,
    DotsThreeCircleIcon,
    StorefrontIcon,
    ReceiptIcon,
    WarningIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/shop/empty-state';
import MoreButton from '@/components/shop/more-button';
import ShareSheet from '@/components/shop/share-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useFormat } from '@/hooks/use-format';
import { useTenant } from '@/hooks/use-tenant';
import { cn } from '@/lib/utils';
import { publicDebtUrl } from '@/lib/whatsapp';
import { show as catalog } from '@/routes/catalog';
import { index as finance } from '@/routes/finance';
import { show as more } from '@/routes/more';
import { create as createSale, show as showSale } from '@/routes/sales';

type Owed = {
    id: number;
    customer: string;
    phone: string | null;
    publicToken: string;
    amountCents: number;
    dueDate: string;
    isOverdue: boolean;
};

type PendingClaim = {
    id: number;
    saleId: number;
    customer: string | null;
    amountCents: number;
    hasReceipt: boolean;
};

type Props = {
    hasSales: boolean;
    pendingClaims: PendingClaim[];
    pendingClaimsCount: number;
    salesTodayCents: number;
    monthProfitCents: number;
    receivableTodayCents: number;
    receivableOverdueCents: number;
    lowStock: { id: number; name: string; quantity: number }[];
    owed: Owed[];
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
        <div className="bg-card border-border rounded-2xl border p-3 lg:p-4">
            <p className="text-muted-foreground mb-1 text-xs lg:mb-1.5 lg:text-[12.5px]">
                {label}
            </p>
            <p
                className={cn(
                    'text-lg font-bold lg:text-[21px]',
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
    pendingClaims,
    pendingClaimsCount,
    salesTodayCents,
    monthProfitCents,
    receivableTodayCents,
    receivableOverdueCents,
    lowStock,
    owed,
}: Props) {
    const { t } = useTranslation('shop');
    const { money, shortDate } = useFormat();
    const tenant = useTenant();
    const [charging, setCharging] = useState<Owed | null>(null);

    const shortcuts = [
        {
            icon: ChartLineUpIcon,
            label: 'home.shortcuts.finance',
            href: finance.url(),
        },
        {
            icon: StorefrontIcon,
            label: 'home.shortcuts.catalog',
            href: catalog.url(),
        },
        {
            icon: DotsThreeCircleIcon,
            label: 'home.shortcuts.more',
            href: more.url(),
        },
    ];

    return (
        <>
            <Head title={t('nav.home')} />

            {!hasSales ? (
                <>
                    <div className="flex justify-end px-5 pt-4 lg:hidden">
                        <MoreButton />
                    </div>
                    <EmptyState
                        icon={<BagIcon />}
                        title={t('home.empty.title')}
                        description={t('home.empty.description')}
                    >
                        <Button
                            asChild
                            size="lg"
                            className="h-12 px-6 text-[15px]"
                        >
                            <Link href={createSale.url()}>
                                {t('home.empty.action')}
                            </Link>
                        </Button>
                    </EmptyState>
                </>
            ) : (
                <div className="flex flex-col gap-[18px] px-5 pt-5 lg:gap-5 lg:px-0 lg:pt-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h1 className="font-heading text-xl font-bold lg:text-2xl">
                                {t('home.greeting', { name: tenant?.name })}
                            </h1>
                            <p className="text-muted-foreground text-[13px] lg:text-sm">
                                {t('home.subtitle')}
                            </p>
                        </div>
                        <MoreButton />
                    </div>

                    <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto lg:hidden">
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

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                        <Stat
                            label={t('home.salesToday')}
                            value={money(salesTodayCents)}
                        />
                        <Stat
                            label={t('home.monthProfit')}
                            value={money(monthProfitCents)}
                        />
                        <Stat
                            label={t('home.receivableToday')}
                            value={money(receivableTodayCents)}
                        />
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

                    {pendingClaimsCount > 0 && (
                        <section className="flex flex-col gap-2 lg:gap-2.5">
                            <h2 className="flex items-center gap-2 text-sm font-semibold lg:text-[15px]">
                                {t('home.claimsTitle')}
                                <span className="bg-brand text-brand-foreground rounded-full px-2 py-0.5 text-[11.5px] font-bold tabular-nums">
                                    {pendingClaimsCount}
                                </span>
                            </h2>
                            <div className="border-border divide-border divide-y overflow-hidden rounded-2xl border">
                                {pendingClaims.map((claim) => (
                                    <Link
                                        key={claim.id}
                                        href={showSale.url({
                                            sale: claim.saleId,
                                        })}
                                        className="hover:bg-muted flex items-center gap-2.5 p-3 lg:px-4 lg:py-3.5"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium lg:text-[14.5px]">
                                                {claim.customer}
                                            </p>
                                            {claim.hasReceipt && (
                                                <p className="text-muted-foreground flex items-center gap-1 text-xs lg:text-[12.5px]">
                                                    <ReceiptIcon className="size-3.5" />
                                                    {t('home.claimsReceipt')}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-sm font-semibold lg:text-[14.5px]">
                                            {money(claim.amountCents)}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="flex flex-col gap-2 lg:gap-2.5">
                        <h2 className="text-sm font-semibold lg:text-[15px]">
                            {t('home.owedTitle')}
                        </h2>
                        {owed.length === 0 ? (
                            <p className="text-muted-foreground border-border rounded-2xl border border-dashed p-4 text-center text-[13px]">
                                {t('home.owedEmpty')}
                            </p>
                        ) : (
                            <div className="border-border divide-border divide-y overflow-hidden rounded-2xl border">
                                {owed.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-2.5 p-3 lg:px-4 lg:py-3.5"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium lg:text-[14.5px]">
                                                {item.customer}
                                            </p>
                                            <p
                                                className={cn(
                                                    'text-xs lg:text-[12.5px]',
                                                    item.isOverdue
                                                        ? 'text-destructive'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                {item.isOverdue
                                                    ? t('dueLabel.overdue', {
                                                          date: shortDate(
                                                              item.dueDate,
                                                          ),
                                                      })
                                                    : t('dueLabel.dueToday')}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold lg:text-[14.5px]">
                                            {money(item.amountCents)}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setCharging(item)}
                                        >
                                            {t('home.charge')}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {charging && (
                <ShareSheet
                    key={charging.id}
                    open
                    onOpenChange={(open) => !open && setCharging(null)}
                    phone={charging.phone}
                    templates={[
                        {
                            key: 'charge',
                            label: t('share.charge'),
                            message: t(
                                charging.isOverdue
                                    ? 'home.chargeOverdueMessage'
                                    : 'home.chargeMessage',
                                {
                                    name: charging.customer,
                                    amount: money(charging.amountCents),
                                    link: publicDebtUrl(charging.publicToken),
                                },
                            ),
                        },
                    ]}
                />
            )}
        </>
    );
}
