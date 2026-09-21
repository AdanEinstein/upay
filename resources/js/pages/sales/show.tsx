import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckIcon, WhatsappLogoIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import MoneyInput from '@/components/money-input';
import BottomSheet from '@/components/shop/bottom-sheet';
import { Chip } from '@/components/shop/chip';
import PageHeader from '@/components/shop/page-header';
import ShareSheet from '@/components/shop/share-sheet';
import { StatusBadge } from '@/components/shop/status-badge';
import type { SettlementStatus } from '@/components/shop/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormat } from '@/hooks/use-format';
import { useTenant } from '@/hooks/use-tenant';
import { publicDebtUrl, whatsappUrl } from '@/lib/whatsapp';
import { store as storePayment } from '@/routes/installments/payments';
import { create, destroy, index, show } from '@/routes/sales';

type Installment = {
    id: number;
    number: number;
    amountCents: number;
    remainingCents: number;
    dueDate: string;
    paidAt: string | null;
};

type Sale = {
    id: number;
    totalCents: number;
    cancelled: boolean;
    customer: { id: number; name: string; phone: string | null; publicToken: string } | null;
    items: { id: number; name: string; quantity: number; unitPriceCents: number }[];
    installments: Installment[];
    installmentCount: number;
};

const METHODS = ['pix', 'cash', 'card'] as const;
const isoToday = () => new Date().toLocaleDateString('en-CA');

function installmentStatus(installment: Installment): SettlementStatus {
    if (installment.remainingCents === 0) {
        return 'paid';
    }

    const today = isoToday();

    if (installment.dueDate < today) {
        return 'overdue';
    }

    return installment.dueDate === today ? 'due_today' : 'upcoming';
}

export default function ShowSale({ sale, justCreated }: { sale: Sale; justCreated: boolean }) {
    const { t } = useTranslation('shop');
    const { money, shortDate } = useFormat();
    const tenant = useTenant();
    const [paying, setPaying] = useState(false);
    const [sharing, setSharing] = useState<'charge' | 'link' | null>(null);
    const [cancelling, setCancelling] = useState(false);

    const next = sale.installments.find((installment) => installment.remainingCents > 0);
    const owedCents = sale.installments.reduce((sum, installment) => sum + installment.remainingCents, 0);
    const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
    const link = sale.customer ? publicDebtUrl(sale.customer.publicToken) : '';

    const payment = useForm({
        amount_cents: null as number | null,
        method: 'pix' as (typeof METHODS)[number],
        paid_on: isoToday(),
    });

    function openPayment() {
        payment.setData('amount_cents', next?.remainingCents ?? null);
        setPaying(true);
    }

    function submitPayment() {
        if (!next) {
            return;
        }

        payment.post(storePayment.url({ installment: next.id }), {
            preserveScroll: true,
            onSuccess: () => setPaying(false),
        });
    }

    if (justCreated) {
        return (
            <>
                <Head title={t('sale.created.title')} />
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16 text-center lg:bg-card lg:border-border lg:mx-auto lg:my-auto lg:w-[420px] lg:flex-none lg:rounded-2xl lg:border lg:py-10 lg:shadow-lg">
                    <div className="bg-brand-soft text-brand flex size-[76px] items-center justify-center rounded-full">
                        <CheckIcon className="size-8" weight="bold" />
                    </div>
                    <h1 className="font-heading text-xl font-bold">{t('sale.created.title')}</h1>
                    <div className="bg-muted flex w-full max-w-[280px] lg:max-w-none flex-col gap-1.5 rounded-2xl p-3.5 text-left">
                        <div className="text-muted-foreground flex justify-between text-[13px]">
                            <span>{t('sale.created.customer')}</span>
                            <span className="text-foreground font-medium">{sale.customer?.name ?? t('newSale.payment.noCustomer')}</span>
                        </div>
                        <div className="text-muted-foreground flex justify-between text-[13px]">
                            <span>{t('sale.created.items')}</span>
                            <span className="text-foreground font-medium">{t('newSale.products.itemCount', { count: itemCount })}</span>
                        </div>
                        <div className="border-border flex justify-between border-t pt-1.5 text-[15px] font-bold">
                            <span>{t('sale.created.total')}</span>
                            <span>{money(sale.totalCents)}</span>
                        </div>
                    </div>
                    <div className="mt-2 flex w-full max-w-[280px] lg:max-w-none flex-col gap-2.5">
                        {sale.customer && (
                            <Button asChild size="lg" className="h-12 gap-2 text-[15px]">
                                <a
                                    href={whatsappUrl(
                                        sale.customer.phone,
                                        t('sale.created.receiptMessage', {
                                            name: sale.customer.name,
                                            store: tenant?.name,
                                            total: money(sale.totalCents),
                                            link,
                                        }),
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <WhatsappLogoIcon className="size-[17px]" />
                                    {t('sale.created.sendReceipt')}
                                </a>
                            </Button>
                        )}
                        <Button asChild variant="outline" size="lg" className="h-11 text-sm">
                            <Link href={create.url()}>{t('sale.created.newSale')}</Link>
                        </Button>
                        <Button asChild variant="ghost" className="text-sm">
                            <Link href={show.url({ sale: sale.id })} replace>
                                {t('sale.created.view')}
                            </Link>
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={t('sale.title', { id: sale.id })} />
            <PageHeader title={t('sale.title', { id: sale.id })} back={index.url()} />

            <div className="flex flex-col gap-4 px-5 pt-2 lg:grid lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-x-8">
                {sale.cancelled && (
                    <p className="bg-muted text-muted-foreground rounded-xl px-3 py-2 text-[13px] lg:col-span-2">
                        {t('sale.cancelledNotice')}
                    </p>
                )}

                <div className="flex items-center justify-between lg:col-span-2">
                    <div>
                        <p className="text-muted-foreground text-[13px]">{t('sale.customer')}</p>
                        <p className="mt-0.5 text-[15px] font-semibold">{sale.customer?.name ?? t('sale.counter')}</p>
                    </div>
                    <p className="text-[22px] font-bold">{money(sale.totalCents)}</p>
                </div>

                <div className="flex flex-col gap-4">
                <div className="border-border divide-border divide-y overflow-hidden rounded-2xl border">
                    {sale.items.map((item) => (
                        <div key={item.id} className="flex justify-between px-3 py-2.5 text-[13.5px]">
                            <span>
                                {item.quantity > 1 && `${item.quantity}× `}
                                {item.name}
                            </span>
                            <span className="text-muted-foreground">{money(item.unitPriceCents * item.quantity)}</span>
                        </div>
                    ))}
                </div>

                {sale.installments.length > 0 && (
                    <div>
                        <p className="text-muted-foreground mb-2 text-[13px] font-semibold">{t('sale.installments')}</p>
                        <div className="flex flex-col gap-2">
                            {sale.installments.map((installment) => {
                                const status = installmentStatus(installment);

                                return (
                                    <div key={installment.id} className="border-border flex items-center gap-2.5 rounded-xl border px-3 py-2.5">
                                        <div className="flex-1">
                                            <p className="text-[13.5px] font-medium">
                                                {installment.number === 0
                                                    ? t('sale.downPayment')
                                                    : t('sale.installmentOf', { number: installment.number, total: sale.installmentCount })}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {status === 'paid' && installment.paidAt
                                                    ? t('dueLabel.paid', { date: shortDate(installment.paidAt) })
                                                    : status === 'due_today'
                                                      ? t('dueLabel.dueToday')
                                                      : t(status === 'overdue' ? 'dueLabel.overdue' : 'dueLabel.upcoming', { date: shortDate(installment.dueDate) })}
                                            </p>
                                        </div>
                                        <span className="text-[13.5px] font-semibold">{money(installment.amountCents)}</span>
                                        <StatusBadge status={status} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                </div>

                {!sale.cancelled && (
                    <div className="flex flex-col gap-2">
                        {next && (
                            <Button size="lg" className="h-11 text-[14.5px]" onClick={openPayment}>
                                {t('sale.registerPayment')}
                            </Button>
                        )}
                        {sale.customer && (
                            <>
                                {owedCents > 0 && (
                                    <Button variant="outline" size="lg" className="h-11 text-[14.5px]" onClick={() => setSharing('charge')}>
                                        {t('sale.chargeWhatsapp')}
                                    </Button>
                                )}
                                <Button variant="outline" size="lg" className="h-11 text-[14.5px]" onClick={() => setSharing('link')}>
                                    {t('sale.shareLink')}
                                </Button>
                            </>
                        )}
                        <Button variant="ghost" className="text-destructive h-10 text-[13.5px]" onClick={() => setCancelling(true)}>
                            {t('sale.cancel')}
                        </Button>
                    </div>
                )}
            </div>

            <BottomSheet open={paying} onOpenChange={setPaying} title={t('sale.payment.title')}>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="payment-amount">{t('sale.payment.amount')}</Label>
                    <MoneyInput id="payment-amount" cents={payment.data.amount_cents} onCentsChange={(cents) => payment.setData('amount_cents', cents)} className="h-11" />
                    <InputError message={payment.errors.amount_cents} />
                </div>
                <div>
                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">{t('sale.payment.method')}</p>
                    <div className="flex gap-2">
                        {METHODS.map((item) => (
                            <Chip key={item} active={payment.data.method === item} onClick={() => payment.setData('method', item)}>
                                {t(`methods.${item}`)}
                            </Chip>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="payment-date">{t('sale.payment.date')}</Label>
                    <Input id="payment-date" type="date" max={isoToday()} value={payment.data.paid_on} onChange={(event) => payment.setData('paid_on', event.target.value)} className="h-11" />
                    <InputError message={payment.errors.paid_on} />
                </div>
                <Button size="lg" className="h-12 text-base" disabled={payment.processing || !payment.data.amount_cents} onClick={submitPayment}>
                    {t('sale.payment.confirm')}
                </Button>
            </BottomSheet>

            {sale.customer && (
                <ShareSheet
                    open={sharing !== null}
                    onOpenChange={(open) => !open && setSharing(null)}
                    phone={sale.customer.phone}
                    templates={[
                        {
                            key: sharing ?? 'charge',
                            label: t('share.charge'),
                            message:
                                sharing === 'link'
                                    ? t('customers.detail.linkMessage', { name: sale.customer.name, link })
                                    : t('share.chargeMessage', { name: sale.customer.name, amount: money(owedCents), link }),
                        },
                    ]}
                />
            )}

            <BottomSheet open={cancelling} onOpenChange={setCancelling} title={t('sale.cancel')} description={t('sale.cancelConfirm')}>
                <Button
                    variant="destructive"
                    size="lg"
                    className="h-12 text-base"
                    onClick={() => router.delete(destroy.url({ sale: sale.id }), { onSuccess: () => setCancelling(false) })}
                >
                    {t('sale.cancel')}
                </Button>
            </BottomSheet>
        </>
    );
}
