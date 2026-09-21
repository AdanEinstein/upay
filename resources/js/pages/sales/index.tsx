import { Head, Link } from '@inertiajs/react';
import { BagIcon, ReceiptIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip, ChipRow } from '@/components/shop/chip';
import EmptyState from '@/components/shop/empty-state';
import ScreenTitle from '@/components/shop/screen-title';
import { StatusBadge, useDueLabel } from '@/components/shop/status-badge';
import type { SettlementStatus } from '@/components/shop/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormat } from '@/hooks/use-format';
import { index as receivables } from '@/routes/receivables';
import { create, show } from '@/routes/sales';

type Sale = {
    id: number;
    customer: string | null;
    totalCents: number;
    status: SettlementStatus;
    date: string | null;
};

const TABS = ['all', 'receivable', 'overdue', 'paid'] as const;
type Tab = (typeof TABS)[number];

const MATCH: Record<Tab, (sale: Sale) => boolean> = {
    all: () => true,
    receivable: (sale) => sale.status !== 'paid' && sale.status !== 'cancelled',
    overdue: (sale) => sale.status === 'overdue',
    paid: (sale) => sale.status === 'paid',
};

export default function SalesIndex({ sales }: { sales: Sale[] }) {
    const { t } = useTranslation('shop');
    const { money, shortDate } = useFormat();
    const dueLabel = useDueLabel();
    const [tab, setTab] = useState<Tab>('all');
    const [query, setQuery] = useState('');

    const needle = query.trim().toLowerCase();
    const visible = sales.filter(
        (sale) =>
            MATCH[tab](sale) &&
            (needle === '' ||
                (sale.customer ?? t('sales.counter')).toLowerCase().includes(needle)),
    );

    return (
        <>
            <Head title={t('sales.title')} />

            {sales.length === 0 ? (
                <EmptyState
                    icon={<BagIcon />}
                    title={t('sales.empty.title')}
                    description={t('sales.empty.description')}
                >
                    <Button asChild size="lg" className="h-12 px-6 text-[15px]">
                        <Link href={create.url()}>{t('sales.empty.action')}</Link>
                    </Button>
                </EmptyState>
            ) : (
                <>
                    <ScreenTitle
                        action={
                            <Button asChild size="sm" variant="outline">
                                <Link href={receivables.url()}>
                                    <ReceiptIcon />
                                    {t('sales.receivables')}
                                </Link>
                            </Button>
                        }
                    >
                        {t('sales.title')}
                    </ScreenTitle>

                    <div className="flex flex-col gap-2.5 px-5">
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={t('sales.searchPlaceholder')}
                            className="h-10 lg:w-[280px]"
                        />
                        <ChipRow>
                            {TABS.map((key) => (
                                <Chip key={key} active={tab === key} onClick={() => setTab(key)}>
                                    {t(`sales.tabs.${key}`)}
                                </Chip>
                            ))}
                        </ChipRow>
                    </div>

                    <ul className="flex flex-col gap-2 px-5 pt-2">
                        {visible.map((sale) => (
                            <li key={sale.id}>
                                <Link
                                    href={show.url({ sale: sale.id })}
                                    className="border-border flex items-center gap-2.5 rounded-2xl border p-3 lg:gap-3 lg:px-4 lg:py-3.5"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold lg:text-[14.5px]">
                                            {sale.customer ?? t('sales.counter')}
                                        </p>
                                        <p className="text-muted-foreground mt-0.5 text-xs">
                                            {dueLabel(sale.status, sale.date, shortDate)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-sm font-bold">
                                            {money(sale.totalCents)}
                                        </span>
                                        <StatusBadge status={sale.status} />
                                    </div>
                                </Link>
                            </li>
                        ))}
                        {visible.length === 0 && (
                            <li className="text-muted-foreground py-10 text-center text-sm">
                                {t('common.noResults')}
                            </li>
                        )}
                    </ul>
                </>
            )}
        </>
    );
}
