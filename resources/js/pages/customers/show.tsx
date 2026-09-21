import { Head, Link } from '@inertiajs/react';
import { PencilSimpleIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/shop/page-header';
import ShareSheet from '@/components/shop/share-sheet';
import { Button } from '@/components/ui/button';
import { useFormat } from '@/hooks/use-format';
import { useInitials } from '@/hooks/use-initials';
import { formatPhone, publicDebtUrl } from '@/lib/whatsapp';
import { edit, index } from '@/routes/customers';
import { create as createSale, show as showSale } from '@/routes/sales';

type Props = {
    customer: {
        id: number;
        name: string;
        phone: string | null;
        notes: string | null;
        publicToken: string;
        since: string;
        balanceCents: number;
    };
    sales: {
        id: number;
        soldAt: string;
        totalCents: number;
        items: string[];
        installmentCount: number;
        status: string;
    }[];
};

export default function ShowCustomer({ customer, sales }: Props) {
    const { t } = useTranslation('shop');
    const { money, shortDate, date } = useFormat();
    const getInitials = useInitials();
    const [sharing, setSharing] = useState<'charge' | 'link' | null>(null);
    const link = publicDebtUrl(customer.publicToken);

    const kind = (sale: Props['sales'][number]) => {
        if (sale.status === 'cancelled') {
            return t('customers.detail.cancelled');
        }

        if (sale.installmentCount > 1) {
            return t('customers.detail.installments', { count: sale.installmentCount });
        }

        return sale.status === 'paid' ? t('customers.detail.cash') : t('customers.detail.credit');
    };

    return (
        <>
            <Head title={customer.name} />
            <PageHeader
                title=""
                back={index.url()}
                action={
                    <Button asChild variant="outline" size="icon-sm" aria-label={t('common.edit')}>
                        <Link href={edit.url({ customer: customer.id })}>
                            <PencilSimpleIcon />
                        </Link>
                    </Button>
                }
            />

            <div className="flex flex-col gap-[18px] px-5">
                <div className="flex flex-col items-center gap-2.5 text-center">
                    <span className="bg-muted flex size-16 items-center justify-center rounded-full text-xl font-semibold">
                        {getInitials(customer.name)}
                    </span>
                    <div>
                        <p className="text-[17px] font-bold">{customer.name}</p>
                        <p className="text-muted-foreground mt-0.5 text-[13px]">
                            {[formatPhone(customer.phone), t('customers.detail.since', { date: date(customer.since) })]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    </div>
                </div>

                <div className="bg-muted rounded-2xl p-4 text-center">
                    <p className="text-muted-foreground mb-1 text-[12.5px]">{t('customers.detail.balance')}</p>
                    <p className={`text-[26px] font-bold ${customer.balanceCents > 0 ? 'text-destructive' : ''}`}>
                        {money(customer.balanceCents)}
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <Button asChild size="lg" className="h-11 text-[14.5px]">
                        <Link href={createSale.url(undefined, { query: { customer: customer.id } })}>{t('customers.detail.newSale')}</Link>
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="h-10 text-[13.5px]" onClick={() => setSharing('charge')}>
                            {t('customers.detail.chargeWhatsapp')}
                        </Button>
                        <Button variant="outline" className="h-10 text-[13.5px]" onClick={() => setSharing('link')}>
                            {t('customers.detail.sendLink')}
                        </Button>
                    </div>
                </div>

                <div>
                    <h2 className="mb-2 text-sm font-semibold">{t('customers.detail.history')}</h2>
                    {sales.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{t('customers.detail.noHistory')}</p>
                    ) : (
                        <div className="border-border divide-border divide-y overflow-hidden rounded-2xl border">
                            {sales.map((sale) => (
                                <Link key={sale.id} href={showSale.url({ sale: sale.id })} className="flex items-center justify-between gap-3 px-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-[13.5px] font-medium">
                                            {sale.items[0]}
                                            {sale.items.length > 1 && ` + ${sale.items.length - 1}`}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            {shortDate(sale.soldAt)} · {kind(sale)}
                                        </p>
                                    </div>
                                    <span className="text-[13.5px] font-semibold">{money(sale.totalCents)}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ShareSheet
                open={sharing !== null}
                onOpenChange={(open) => !open && setSharing(null)}
                phone={customer.phone}
                templates={[
                    {
                        key: sharing ?? 'charge',
                        label: t('share.charge'),
                        message:
                            sharing === 'link'
                                ? t('customers.detail.linkMessage', { name: customer.name, link })
                                : t('share.chargeMessage', { name: customer.name, amount: money(customer.balanceCents), link }),
                    },
                ]}
            />
        </>
    );
}
