import { Head, router } from '@inertiajs/react';
import { CheckIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/shop/page-header';
import { useFormat } from '@/hooks/use-format';
import { cn } from '@/lib/utils';
import { index as sales } from '@/routes/sales';
import { store } from '@/routes/installments/payments';

type Row = { id: number; customer: string | null; dueDate: string; amountCents: number };
type Groups = Record<'overdue' | 'today' | 'week' | 'later', Row[]>;

const ORDER = ['overdue', 'today', 'week', 'later'] as const;

export default function Receivables({ groups }: { groups: Groups }) {
    const { t } = useTranslation('shop');
    const { money, shortDate } = useFormat();
    const empty = ORDER.every((key) => groups[key].length === 0);

    function markPaid(row: Row) {
        router.post(
            store.url({ installment: row.id }),
            { amount_cents: row.amountCents, method: 'pix' },
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title={t('receivables.title')} />
            <PageHeader title={t('receivables.title')} back={sales.url()} />

            <div className="flex flex-col gap-4 px-5 pt-2 lg:max-w-[700px] lg:gap-5">
                {empty && (
                    <p className="text-muted-foreground py-10 text-center text-sm">
                        {t('receivables.empty')}
                    </p>
                )}
                {ORDER.filter((key) => groups[key].length > 0).map((key) => (
                    <section key={key} className="flex flex-col gap-2">
                        <h2
                            className={cn(
                                'text-[12.5px] font-bold tracking-wide uppercase',
                                key === 'overdue' ? 'text-destructive' : 'text-muted-foreground',
                            )}
                        >
                            {t(`receivables.groups.${key}`)}
                        </h2>
                        {groups[key].map((row) => (
                            <div
                                key={row.id}
                                className="border-border flex items-center gap-2.5 rounded-xl border px-3 py-2.5 lg:gap-3 lg:px-3.5 lg:py-3"
                            >
                                <button
                                    type="button"
                                    onClick={() => markPaid(row)}
                                    aria-label={t('receivables.markPaid')}
                                    className="border-border bg-card text-brand-foreground hover:bg-brand flex size-6 shrink-0 items-center justify-center rounded-full border-2"
                                >
                                    <CheckIcon className="size-3.5" weight="bold" />
                                </button>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13.5px] font-medium">
                                        {row.customer ?? t('receivables.counter')}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {shortDate(row.dueDate)}
                                    </p>
                                </div>
                                <span className="text-[13.5px] font-semibold">
                                    {money(row.amountCents)}
                                </span>
                            </div>
                        ))}
                    </section>
                ))}
            </div>
        </>
    );
}
