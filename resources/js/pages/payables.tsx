import { Head, router } from '@inertiajs/react';
import { CheckIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/shop/page-header';
import { useFormat } from '@/hooks/use-format';
import { cn } from '@/lib/utils';
import { pay } from '@/routes/expenses';
import { index as finance } from '@/routes/finance';

type Row = {
    id: number;
    description: string;
    dueDate: string;
    amountCents: number;
};
type Groups = Record<'overdue' | 'today' | 'week' | 'later', Row[]>;

const ORDER = ['overdue', 'today', 'week', 'later'] as const;

export default function Payables({ groups }: { groups: Groups }) {
    const { t } = useTranslation('shop');
    const { money, shortDate } = useFormat();
    const empty = ORDER.every((key) => groups[key].length === 0);

    return (
        <>
            <Head title={t('payables.title')} />
            <PageHeader title={t('payables.title')} back={finance.url()} />

            <div className="flex flex-col gap-4 px-5 pt-2">
                {empty && (
                    <p className="text-muted-foreground py-10 text-center text-sm">
                        {t('payables.empty')}
                    </p>
                )}
                {ORDER.filter((key) => groups[key].length > 0).map((key) => (
                    <section key={key} className="flex flex-col gap-2">
                        <h2
                            className={cn(
                                'text-[12.5px] font-bold tracking-wide uppercase',
                                key === 'overdue'
                                    ? 'text-destructive'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {t(`payables.groups.${key}`)}
                        </h2>
                        {groups[key].map((row) => (
                            <div
                                key={row.id}
                                className="border-border flex items-center gap-2.5 rounded-xl border px-3 py-2.5"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.post(
                                            pay.url({ expense: row.id }),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    aria-label={t('payables.markPaid')}
                                    className="border-border bg-card text-brand-foreground hover:bg-brand flex size-6 shrink-0 items-center justify-center rounded-full border-2"
                                >
                                    <CheckIcon
                                        className="size-3.5"
                                        weight="bold"
                                    />
                                </button>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13.5px] font-medium">
                                        {row.description}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {key === 'today'
                                            ? t('payables.due.today')
                                            : t(
                                                  `payables.due.${key === 'overdue' ? 'overdue' : 'future'}`,
                                                  {
                                                      date: shortDate(
                                                          row.dueDate,
                                                      ),
                                                  },
                                              )}
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
