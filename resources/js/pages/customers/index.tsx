import { Head, Link } from '@inertiajs/react';
import { PlusIcon, UserPlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/shop/chip';
import EmptyState from '@/components/shop/empty-state';
import ScreenTitle from '@/components/shop/screen-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormat } from '@/hooks/use-format';
import { useInitials } from '@/hooks/use-initials';
import { formatPhone } from '@/lib/whatsapp';
import { create, show } from '@/routes/customers';

type Customer = {
    id: number;
    name: string;
    phone: string | null;
    balanceCents: number;
};

export default function CustomersIndex({
    customers,
}: {
    customers: Customer[];
}) {
    const { t } = useTranslation('shop');
    const { money } = useFormat();
    const getInitials = useInitials();
    const [query, setQuery] = useState('');
    const [onlyDebt, setOnlyDebt] = useState(false);

    const needle = query.trim().toLowerCase();
    const visible = customers.filter(
        (customer) =>
            (!onlyDebt || customer.balanceCents > 0) &&
            (needle === '' || customer.name.toLowerCase().includes(needle)),
    );

    if (customers.length === 0) {
        return (
            <>
                <Head title={t('customers.title')} />
                <EmptyState
                    icon={<UserPlusIcon />}
                    title={t('customers.empty.title')}
                    description={t('customers.empty.description')}
                >
                    <Button asChild size="lg" className="h-12 px-6 text-[15px]">
                        <Link href={create.url()}>
                            {t('customers.empty.action')}
                        </Link>
                    </Button>
                </EmptyState>
            </>
        );
    }

    return (
        <>
            <Head title={t('customers.title')} />
            <ScreenTitle
                action={
                    <>
                        <Button
                            asChild
                            size="icon-sm"
                            aria-label={t('customers.empty.action')}
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
                                {t('customers.empty.action')}
                            </Link>
                        </Button>
                    </>
                }
            >
                {t('customers.title')}
            </ScreenTitle>

            <div className="flex flex-col gap-2.5 px-5 lg:flex-row lg:items-center">
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t('customers.search')}
                    className="h-10 lg:w-70"
                />
                <div>
                    <Chip
                        active={onlyDebt}
                        onClick={() => setOnlyDebt(!onlyDebt)}
                    >
                        {t('customers.withBalance')}
                    </Chip>
                </div>
            </div>

            <ul className="flex flex-col gap-2 px-5 pt-3">
                {visible.map((customer) => (
                    <li key={customer.id}>
                        <Link
                            href={show.url({ customer: customer.id })}
                            className="border-border flex items-center gap-2.5 rounded-2xl border p-2.5 lg:gap-3 lg:px-3.5 lg:py-3"
                        >
                            <span className="bg-muted flex size-[38px] shrink-0 items-center justify-center rounded-full text-[13px] font-semibold lg:size-10">
                                {getInitials(customer.name)}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold">
                                    {customer.name}
                                </span>
                                <span className="text-muted-foreground mt-0.5 block text-xs">
                                    {formatPhone(customer.phone)}
                                </span>
                            </span>
                            {customer.balanceCents > 0 && (
                                <span className="bg-destructive/15 text-destructive rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap">
                                    {money(customer.balanceCents)}
                                </span>
                            )}
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
    );
}
