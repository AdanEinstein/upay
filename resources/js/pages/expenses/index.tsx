import { Head, Link } from '@inertiajs/react';
import { CurrencyCircleDollarIcon, PlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/shop/chip';
import EmptyState from '@/components/shop/empty-state';
import PageHeader from '@/components/shop/page-header';
import { Button } from '@/components/ui/button';
import { useFormat } from '@/hooks/use-format';
import { cn } from '@/lib/utils';
import { create, edit } from '@/routes/expenses';
import { index as finance } from '@/routes/finance';

type Expense = {
    id: number;
    category: string;
    description: string;
    amountCents: number;
    dueDate: string;
    paid: boolean;
};

const TABS = ['all', 'paid', 'pending'] as const;

export default function ExpensesIndex({ expenses }: { expenses: Expense[] }) {
    const { t } = useTranslation('shop');
    const { money, date } = useFormat();
    const [tab, setTab] = useState<(typeof TABS)[number]>('all');

    const visible = expenses.filter(
        (expense) => tab === 'all' || (tab === 'paid') === expense.paid,
    );
    const groups = Object.entries(
        Object.groupBy(visible, (expense) => expense.dueDate),
    );

    return (
        <>
            <Head title={t('expenses.title')} />
            <PageHeader
                title={t('expenses.title')}
                back={finance.url()}
                action={
                    <>
                        <Button
                            asChild
                            size="icon-sm"
                            aria-label={t('expenses.empty.action')}
                            className="lg:hidden"
                        >
                            <Link href={create.url()}>
                                <PlusIcon />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            className="hidden h-10 text-sm lg:inline-flex"
                        >
                            <Link href={create.url()}>
                                {t('expenses.empty.action')}
                            </Link>
                        </Button>
                    </>
                }
            />

            {expenses.length === 0 ? (
                <EmptyState
                    icon={<CurrencyCircleDollarIcon />}
                    title={t('expenses.empty.title')}
                    description={t('expenses.empty.description')}
                >
                    <Button asChild size="lg" className="h-12 px-6 text-[15px]">
                        <Link href={create.url()}>
                            {t('expenses.empty.action')}
                        </Link>
                    </Button>
                </EmptyState>
            ) : (
                <div className="flex flex-col gap-4 px-5 pt-2">
                    <div className="flex gap-1.5">
                        {TABS.map((key) => (
                            <Chip
                                key={key}
                                active={tab === key}
                                onClick={() => setTab(key)}
                            >
                                {t(`expenses.tabs.${key}`)}
                            </Chip>
                        ))}
                    </div>
                    {groups.map(([day, items]) => (
                        <section key={day} className="flex flex-col gap-2">
                            <h2 className="text-muted-foreground text-[12.5px] font-bold">
                                {date(day)}
                            </h2>
                            {items?.map((expense) => (
                                <Link
                                    key={expense.id}
                                    href={edit.url({ expense: expense.id })}
                                    className="border-border flex items-center gap-2.5 rounded-xl border px-3 py-2.5"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13.5px] font-semibold">
                                            {t(
                                                `expenses.categories.${expense.category}`,
                                            )}
                                        </p>
                                        <p className="text-muted-foreground truncate text-xs">
                                            {expense.description}
                                        </p>
                                    </div>
                                    <span className="text-[13.5px] font-bold">
                                        {money(expense.amountCents)}
                                    </span>
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                            expense.paid
                                                ? 'bg-brand-soft text-brand'
                                                : 'bg-chart-4/20 text-chart-4',
                                        )}
                                    >
                                        {expense.paid
                                            ? t('status.paid')
                                            : t('status.pending')}
                                    </span>
                                </Link>
                            ))}
                        </section>
                    ))}
                    {groups.length === 0 && (
                        <p className="text-muted-foreground py-10 text-center text-sm">
                            {t('common.noResults')}
                        </p>
                    )}
                </div>
            )}
        </>
    );
}
