import { Head, useForm } from '@inertiajs/react';
import {
    CheckCircleIcon,
    CheckIcon,
    CopyIcon,
    PaperclipIcon,
    ReceiptIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import EmptyState from '@/components/shop/empty-state';
import PeriodRuler from '@/components/shop/period-ruler';
import PlanUsage from '@/components/shop/plan-usage';
import type { PlanUsageItem } from '@/components/shop/plan-usage';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { useFormat } from '@/hooks/use-format';
import { cn } from '@/lib/utils';
import { whatsappUrl } from '@/lib/whatsapp';
import { claim, show } from '@/routes/billing';

type Invoice = {
    id: number;
    cycle: 'monthly' | 'annual';
    amountCents: number;
    dueDate: string;
    status: 'open' | 'claimed' | 'paid' | 'canceled';
    overdue: boolean;
    rejectionReason: string | null;
};

type Subscription = {
    plan: string;
    cycle: 'monthly' | 'annual';
    status: 'active' | 'past_due' | 'canceled';
    suspended: boolean;
    trial: boolean;
    periodStart: string;
    periodEnd: string;
    periodDays: number;
    daysLeft: number;
    canceledAt: string | null;
    usage: PlanUsageItem[];
};

type State = 'active' | 'claimed' | 'overdue' | 'suspended' | 'canceled';

const PILL: Record<State, string> = {
    active: 'bg-brand-soft text-brand',
    claimed: 'bg-chart-4/20 text-chart-4',
    overdue: 'bg-destructive/15 text-destructive',
    suspended: 'bg-destructive/15 text-destructive',
    canceled: 'bg-muted text-muted-foreground',
};

type Props = {
    subscription: Subscription | null;
    current:
        | (Invoice & { pixCode: string | null; pixQr: string | null })
        | null;
    history: Invoice[];
    supportWhatsapp: string | null;
};

function CurrentInvoice({
    invoice,
    supportWhatsapp,
}: {
    invoice: NonNullable<Props['current']>;
    supportWhatsapp: string | null;
}) {
    const { t } = useTranslation('shop');
    const { money, shortDate } = useFormat();
    const [, copy] = useClipboard();
    const [copied, setCopied] = useState(false);
    const notice = useForm({ receipt: null as File | null });

    async function copyPix() {
        if (!(await copy(invoice.pixCode ?? ''))) {
            toast.error(t('billing.copyFailed'));

            return;
        }

        toast.success(t('billing.copied'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function sendNotice() {
        notice.post(claim.url({ invoice: invoice.id }), {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    return (
        <div className="border-border flex flex-col items-center gap-3.5 rounded-2xl border p-4 text-center">
            <p className="text-muted-foreground text-[13px]">
                {t(invoice.overdue ? 'billing.overdueSince' : 'billing.dueOn', {
                    date: shortDate(invoice.dueDate),
                })}
            </p>
            <p className="text-[28px] font-bold tabular-nums">
                {money(invoice.amountCents)}
            </p>

            {invoice.rejectionReason && invoice.status === 'open' && (
                <p className="bg-destructive/15 text-destructive w-full rounded-xl px-3 py-2.5 text-[13px] font-medium">
                    {t('billing.rejected', { reason: invoice.rejectionReason })}
                </p>
            )}

            {invoice.pixCode ? (
                <>
                    {invoice.pixQr && (
                        <img
                            src={`data:image/svg+xml;utf8,${encodeURIComponent(invoice.pixQr)}`}
                            alt={t('billing.qrAlt')}
                            className="size-52 bg-white"
                        />
                    )}
                    <Button className="h-12 w-full text-base" onClick={copyPix}>
                        {copied ? <CheckIcon /> : <CopyIcon />}
                        {copied ? t('billing.copiedPix') : t('billing.copyPix')}
                    </Button>
                    <p className="text-muted-foreground max-w-[280px] text-[12.5px] leading-normal">
                        {t('billing.pixHint')}
                    </p>
                </>
            ) : (
                <p className="text-muted-foreground max-w-[280px] text-[13px]">
                    {t('billing.pixMissing')}
                    {supportWhatsapp && (
                        <>
                            {' '}
                            <a
                                className="text-brand underline"
                                href={whatsappUrl(
                                    supportWhatsapp,
                                    t('billing.supportMessage'),
                                )}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {t('billing.contactSupport')}
                            </a>
                        </>
                    )}
                </p>
            )}

            {invoice.status === 'claimed' ? (
                <p className="bg-muted w-full rounded-xl px-3 py-2.5 text-[13px] font-medium">
                    {t('billing.claimPending')}
                </p>
            ) : (
                <div className="border-border flex w-full flex-col gap-2 border-t pt-4">
                    <label className="text-muted-foreground hover:border-primary/50 has-[:focus-visible]:ring-ring/50 border-border flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 text-[13px] transition-colors has-[:focus-visible]:ring-[3px]">
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="sr-only"
                            onChange={(event) =>
                                notice.setData(
                                    'receipt',
                                    event.target.files?.[0] ?? null,
                                )
                            }
                        />
                        <PaperclipIcon className="size-4 shrink-0" />
                        <span className="truncate">
                            {notice.data.receipt
                                ? t('billing.receiptChosen', {
                                      name: notice.data.receipt.name,
                                  })
                                : t('billing.receipt')}
                        </span>
                    </label>
                    {notice.errors.receipt && (
                        <p className="text-destructive text-[12.5px]">
                            {notice.errors.receipt}
                        </p>
                    )}
                    <Button
                        variant="outline"
                        className="h-11 w-full"
                        disabled={notice.processing}
                        onClick={sendNotice}
                    >
                        <CheckCircleIcon />
                        {t('billing.claimButton')}
                    </Button>
                </div>
            )}
        </div>
    );
}

function PlanStatus({
    subscription,
    claimed,
}: {
    subscription: Subscription;
    claimed: boolean;
}) {
    const { t } = useTranslation('shop');
    const { shortDate } = useFormat();

    const state: State =
        subscription.status === 'canceled'
            ? 'canceled'
            : subscription.suspended
              ? 'suspended'
              : claimed
                ? 'claimed'
                : subscription.status === 'past_due'
                  ? 'overdue'
                  : 'active';

    const late = state === 'overdue' || state === 'suspended';
    const days = Math.abs(subscription.daysLeft);
    const headline =
        state === 'canceled'
            ? t('billing.ruler.accessUntil', {
                  date: shortDate(subscription.periodEnd),
              })
            : subscription.daysLeft < 0
              ? t('billing.ruler.lateDays', { count: days })
              : subscription.daysLeft === 0
                ? t('billing.ruler.today')
                : t(
                      subscription.trial
                          ? 'billing.ruler.daysToFirst'
                          : 'billing.ruler.daysLeft',
                      { count: days },
                  );

    return (
        <section
            aria-label={t('billing.statusLabel')}
            className="border-border rounded-2xl border p-4"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">
                        {t('billing.planCycle', {
                            cycle: t(`billing.cycle.${subscription.cycle}`),
                        })}
                    </p>
                    <h2 className="font-heading truncate text-lg font-bold">
                        {subscription.plan}
                    </h2>
                </div>
                <span
                    className={cn(
                        'shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold',
                        PILL[state],
                    )}
                >
                    {t(`billing.state.${state}`)}
                </span>
            </div>

            <p className="font-heading mt-4 text-[22px] leading-tight font-bold">
                {headline}
            </p>
            <p className="text-muted-foreground mt-1 text-[13px]">
                {t(`billing.stateHint.${state}`)}
            </p>

            {state !== 'canceled' && (
                <PeriodRuler
                    periodDays={subscription.periodDays}
                    daysLeft={subscription.daysLeft}
                    segments={
                        subscription.cycle === 'annual'
                            ? 12
                            : Math.ceil(subscription.periodDays / 7)
                    }
                    tone={late ? 'destructive' : 'brand'}
                    startLabel={shortDate(subscription.periodStart)}
                    endLabel={t(
                        late
                            ? 'billing.ruler.wasDue'
                            : subscription.trial
                              ? 'billing.ruler.firstCharge'
                              : 'billing.ruler.renews',
                        { date: shortDate(subscription.periodEnd) },
                    )}
                />
            )}
        </section>
    );
}

export default function BillingShow({
    subscription,
    current,
    history,
    supportWhatsapp,
}: Props) {
    const { t } = useTranslation('shop');
    const { money, shortDate } = useFormat();

    if (!subscription) {
        return (
            <>
                <Head title={t('billing.title')} />
                <h1 className="sr-only">{t('billing.title')}</h1>
                <Heading
                    variant="small"
                    hideTitleOnMobile
                    title={t('billing.title')}
                    description={t('billing.description')}
                />
                <EmptyState
                    icon={<ReceiptIcon />}
                    title={t('billing.noPlan.title')}
                    description={t('billing.noPlan.description')}
                >
                    {supportWhatsapp && (
                        <Button asChild size="lg" className="h-12 px-6">
                            <a
                                href={whatsappUrl(
                                    supportWhatsapp,
                                    t('billing.noPlan.message'),
                                )}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {t('billing.contactSupport')}
                            </a>
                        </Button>
                    )}
                </EmptyState>
            </>
        );
    }

    return (
        <>
            <Head title={t('billing.title')} />
            <h1 className="sr-only">{t('billing.title')}</h1>
            <Heading
                variant="small"
                hideTitleOnMobile
                title={t('billing.title')}
                description={t('billing.description')}
            />

            <div className="flex flex-col gap-4">
                <PlanStatus
                    subscription={subscription}
                    claimed={current?.status === 'claimed'}
                />

                <section className="border-border flex flex-col gap-3 rounded-2xl border p-4">
                    <h2 className="text-sm font-semibold">
                        {t('billing.usage')}
                    </h2>
                    <PlanUsage items={subscription.usage} />
                </section>

                {current ? (
                    <CurrentInvoice
                        invoice={current}
                        supportWhatsapp={supportWhatsapp}
                    />
                ) : (
                    <p className="text-muted-foreground text-[13px]">
                        {t('billing.upToDate')}
                    </p>
                )}

                {history.length > 0 && (
                    <div>
                        <h2 className="mb-2 text-sm font-semibold">
                            {t('billing.history')}
                        </h2>
                        <ul className="flex flex-col gap-2">
                            {history.map((invoice) => (
                                <li
                                    key={invoice.id}
                                    className="border-border flex items-center justify-between gap-3 rounded-2xl border p-3"
                                >
                                    <div>
                                        <p className="text-sm font-semibold tabular-nums">
                                            {money(invoice.amountCents)}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            {shortDate(invoice.dueDate)}
                                        </p>
                                    </div>
                                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-semibold">
                                        {t(`billing.status.${invoice.status}`)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </>
    );
}

BillingShow.layout = {
    breadcrumbs: [{ title: 'shop:billing.title', href: show() }],
};
