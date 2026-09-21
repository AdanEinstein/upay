import { Head, Link } from '@inertiajs/react';
import { CurrencyDollarIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/shop/empty-state';
import ScreenTitle from '@/components/shop/screen-title';
import { useFormat } from '@/hooks/use-format';
import { cn } from '@/lib/utils';
import { index as expenses } from '@/routes/expenses';
import { index } from '@/routes/finance';
import { index as payables } from '@/routes/payables';
import { index as receivables } from '@/routes/receivables';

type Props = {
    period: 'today' | 'week' | 'month';
    revenueCents: number;
    expensesCents: number;
    profitCents: number;
    receivableCents: number;
    payableCents: number;
    series: { date: string; cents: number }[];
    isEmpty: boolean;
};

const PERIODS = ['today', 'week', 'month'] as const;

export default function Finance({ period, revenueCents, expensesCents, profitCents, receivableCents, payableCents, series, isEmpty }: Props) {
    const { t } = useTranslation('shop');
    const { money, shortDate } = useFormat();
    const max = Math.max(...series.map((point) => point.cents), 1);

    return (
        <>
            <Head title={t('finance.title')} />
            <ScreenTitle>{t('finance.title')}</ScreenTitle>

            <div className="flex flex-col gap-4 px-5">
                <div className="bg-muted flex gap-1 rounded-[10px] p-[3px]">
                    {PERIODS.map((key) => (
                        <Link
                            key={key}
                            href={index.url(undefined, { query: { period: key } })}
                            preserveScroll
                            preserveState
                            aria-current={period === key ? 'true' : undefined}
                            className={cn(
                                'flex-1 rounded-lg py-2 text-center text-[13.5px] font-semibold',
                                period === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                            )}
                        >
                            {t(`finance.period.${key}`)}
                        </Link>
                    ))}
                </div>

                {isEmpty ? (
                    <EmptyState icon={<CurrencyDollarIcon />} title={t('finance.empty.title')} description={t('finance.empty.description')} />
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-card border-border rounded-2xl border p-3">
                                <p className="text-muted-foreground mb-1 text-xs">{t('finance.revenue')}</p>
                                <p className="text-[17px] font-bold">{money(revenueCents)}</p>
                            </div>
                            <div className="bg-card border-border rounded-2xl border p-3">
                                <p className="text-muted-foreground mb-1 text-xs">{t('finance.expenses')}</p>
                                <p className="text-[17px] font-bold">{money(expensesCents)}</p>
                            </div>
                        </div>
                        <div className="bg-brand-soft text-brand rounded-2xl p-3.5">
                            <p className="mb-1 text-[12.5px]">{t('finance.profit')}</p>
                            <p className="text-[22px] font-bold">{money(profitCents)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-muted-foreground mb-0.5 text-xs">{t('finance.receivable')}</p>
                                <p className="text-[15px] font-semibold">{money(receivableCents)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-0.5 text-xs">{t('finance.payable')}</p>
                                <p className="text-destructive text-[15px] font-semibold">{money(payableCents)}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-2.5 text-[13px] font-semibold">{t('finance.chart')}</p>
                            <div className="flex h-[90px] items-end gap-2">
                                {series.map((point) => (
                                    <div
                                        key={point.date}
                                        title={`${shortDate(point.date)} · ${money(point.cents)}`}
                                        className="bg-brand min-h-0.5 flex-1 rounded-t"
                                        style={{ height: `${Math.max((point.cents / max) * 100, 2)}%` }}
                                    />
                                ))}
                            </div>
                            <div className="text-muted-foreground mt-1 flex justify-between text-[11px]">
                                <span>{shortDate(series[0].date)}</span>
                                <span>{shortDate(series[series.length - 1].date)}</span>
                            </div>
                        </div>
                    </>
                )}

                <div className="border-border divide-border divide-y overflow-hidden rounded-2xl border">
                    {[
                        ['finance.links.receivables', receivables.url()],
                        ['finance.links.expenses', expenses.url()],
                        ['finance.links.payables', payables.url()],
                    ].map(([label, href]) => (
                        <Link key={href} href={href} className="block px-3.5 py-3 text-sm">
                            {t(label)}
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}
