import { Head } from '@inertiajs/react';
import {
    CaretLeftIcon,
    CheckCircleIcon,
    CheckIcon,
    CopyIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import MobileScreen from '@/components/mobile-screen';
import EmptyState from '@/components/shop/empty-state';
import { StatusBadge } from '@/components/shop/status-badge';
import type { SettlementStatus } from '@/components/shop/status-badge';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { useFormat } from '@/hooks/use-format';

type Installment = {
    id: number;
    number: number;
    dueDate: string;
    amountCents: number;
    remainingCents: number;
    paidAt: string | null;
    status: SettlementStatus;
    pixCode: string | null;
    pixQr: string | null;
};

type Purchase = {
    id: number;
    soldAt: string;
    totalCents: number;
    paidCents: number;
    installmentCount: number;
    status: SettlementStatus;
    items: { name: string; quantity: number; totalCents: number }[];
    installments: Installment[];
};

type Props = {
    store: string;
    customer: string;
    whatsapp: string | null;
    purchases: Purchase[];
    openCents: number;
};

export default function Debt({ store, customer, purchases, openCents }: Props) {
    const { t } = useTranslation('public');
    const { money, shortDate, date } = useFormat();
    const [purchaseId, setPurchaseId] = useState<number | null>(null);
    const [pixId, setPixId] = useState<number | null>(null);

    const purchase = purchases.find((item) => item.id === purchaseId) ?? null;
    const installment = purchase?.installments.find((item) => item.id === pixId) ?? null;
    const open = purchases.flatMap((item) => item.installments).filter((item) => item.remainingCents > 0);
    const overdue = open.filter((item) => item.status === 'overdue');
    const nextDue = open.filter((item) => item.status !== 'overdue').map((item) => item.dueDate).sort()[0];

    const title = <Head title={t('title')}><meta name="robots" content="noindex" /></Head>;

    if (purchase && installment) {
        return (
            <>
                {title}
                <PixScreen
                    purchase={purchase}
                    installment={installment}
                    onBack={() => setPixId(null)}
                />
            </>
        );
    }

    if (purchase) {
        return (
            <>
                {title}
                <MobileScreen className="gap-4 px-5 pb-8">
                    <Header label={t('purchaseTitle', { date: date(purchase.soldAt) })} onBack={() => setPurchaseId(null)} />

                    <ul className="divide-y rounded-2xl border text-[13.5px]">
                        {purchase.items.map((item, index) => (
                            <li key={index} className="flex justify-between gap-3 px-3 py-2.5">
                                <span>{item.quantity > 1 ? `${item.quantity}x ${item.name}` : item.name}</span>
                                <span className="text-muted-foreground">{money(item.totalCents)}</span>
                            </li>
                        ))}
                    </ul>

                    <dl className="grid grid-cols-3 gap-2 text-center">
                        <Figure label={t('total')} value={money(purchase.totalCents)} />
                        <Figure label={t('alreadyPaid')} value={money(purchase.paidCents)} className="text-brand" />
                        <Figure
                            label={t('remaining')}
                            value={money(Math.max(0, purchase.totalCents - purchase.paidCents))}
                            className="text-destructive"
                        />
                    </dl>

                    <section>
                        <h2 className="text-muted-foreground mb-2 text-[13px] font-semibold">{t('installments')}</h2>
                        <ul className="flex flex-col gap-2">
                            {purchase.installments.map((item) => (
                                <li key={item.id} className="flex flex-col gap-2 rounded-xl border px-3 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex-1">
                                            <p className="text-[13.5px] font-medium">
                                                {t('installmentOf', { number: item.number, total: purchase.installmentCount })}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {item.paidAt
                                                    ? t('paidOn', { date: shortDate(item.paidAt) })
                                                    : item.status === 'overdue'
                                                      ? t('overdueOn', { date: shortDate(item.dueDate) })
                                                      : t('dueOn', { date: shortDate(item.dueDate) })}
                                            </p>
                                        </div>
                                        <span className="text-[13.5px] font-semibold">{money(item.amountCents)}</span>
                                        <StatusBadge status={item.status} />
                                    </div>
                                    {item.pixCode && (
                                        <Button size="sm" className="h-[38px] text-[13px]" onClick={() => setPixId(item.id)}>
                                            {t('payWithPix')}
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                </MobileScreen>
            </>
        );
    }

    if (openCents === 0) {
        return (
            <>
                {title}
                <MobileScreen>
                    <p className="text-muted-foreground px-5 pt-4 text-[13px]">{store}</p>
                    <EmptyState
                        icon={<CheckCircleIcon />}
                        title={t('allPaidTitle')}
                        description={t('allPaidDescription', { name: customer, store })}
                    />
                </MobileScreen>
            </>
        );
    }

    return (
        <>
            {title}
            <MobileScreen className="gap-4 px-5 pt-4 pb-8">
                <header>
                    <p className="text-muted-foreground text-[13px]">{store}</p>
                    <h1 className="font-heading text-xl font-bold">{t('greeting', { name: customer })}</h1>
                </header>

                <div className="bg-muted rounded-2xl p-4">
                    <p className="text-muted-foreground text-[12.5px]">{t('totalOpen')}</p>
                    <p className="text-[26px] font-bold tabular-nums">{money(openCents)}</p>
                    {(overdue.length > 0 || nextDue) && (
                        <p className={overdue.length > 0 ? 'text-destructive mt-1.5 text-[12.5px]' : 'text-muted-foreground mt-1.5 text-[12.5px]'}>
                            {[
                                overdue.length > 0 ? t('overdueCount', { count: overdue.length }) : null,
                                nextDue ? t('nextDue', { date: shortDate(nextDue) }) : null,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                    )}
                </div>

                <section>
                    <h2 className="text-muted-foreground mb-2 text-[13px] font-semibold">{t('myPurchases')}</h2>
                    <ul className="flex flex-col gap-2">
                        {purchases.map((item) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    onClick={() => setPurchaseId(item.id)}
                                    className={`flex w-full items-center gap-2.5 rounded-2xl border p-3 text-left ${item.status === 'paid' ? 'opacity-70' : ''}`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">
                                            {item.items.map((line) => line.name).join(' + ')}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            {date(item.soldAt)} ·{' '}
                                            {item.installmentCount > 1
                                                ? t('installmentsCount', { count: item.installmentCount })
                                                : t('cash')}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold">{money(item.totalCents)}</span>
                                    <StatusBadge status={item.status} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            </MobileScreen>
        </>
    );
}

function Header({ label, onBack }: { label: string; onBack: () => void }) {
    const { t } = useTranslation('public');

    return (
        <div className="flex items-center gap-2.5 pt-3">
            <button
                type="button"
                aria-label={t('back')}
                onClick={onBack}
                className="bg-card flex size-8 items-center justify-center rounded-full border"
            >
                <CaretLeftIcon className="size-4" />
            </button>
            <span className="text-[15px] font-semibold">{label}</span>
        </div>
    );
}

function Figure({ label, value, className }: { label: string; value: string; className?: string }) {
    return (
        <div>
            <dt className="text-muted-foreground text-[11.5px]">{label}</dt>
            <dd className={`mt-0.5 text-sm font-bold ${className ?? ''}`}>{value}</dd>
        </div>
    );
}

function PixScreen({
    purchase,
    installment,
    onBack,
}: {
    purchase: Purchase;
    installment: Installment;
    onBack: () => void;
}) {
    const { t } = useTranslation('public');
    const { money } = useFormat();
    const [, copy] = useClipboard();
    const [copied, setCopied] = useState(false);

    async function copyPix() {
        if (!(await copy(installment.pixCode ?? ''))) {
            toast.error(t('copyFailed'));

            return;
        }

        toast.success(t('copied'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <MobileScreen className="px-5 pb-8">
            <Header label={t('pixTitle')} onBack={onBack} />

            <div className="flex flex-col items-center gap-3.5 pt-2 text-center">
                <p className="text-muted-foreground text-[13px]">
                    {t('pixAmount', { number: installment.number, total: purchase.installmentCount })}
                </p>
                <p className="text-[28px] font-bold tabular-nums">{money(installment.remainingCents)}</p>
                {installment.pixQr && (
                    <img
                        src={`data:image/svg+xml;utf8,${encodeURIComponent(installment.pixQr)}`}
                        alt={t('pixQrAlt')}
                        className="size-40 rounded-xl border bg-white"
                    />
                )}
                <Button className="h-12 w-full text-base" onClick={copyPix}>
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? t('copiedPix') : t('copyPix')}
                </Button>
                <p className="text-muted-foreground max-w-[280px] text-[12.5px] leading-normal">{t('pixHint')}</p>
                <p className="text-muted-foreground max-w-[280px] text-[11.5px]">{t('pixConfirmation')}</p>
            </div>
        </MobileScreen>
    );
}
