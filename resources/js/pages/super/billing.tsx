import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircleIcon, PaperclipIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Chip, ChipRow } from '@/components/shop/chip';
import ReceiptViewer from '@/components/shop/receipt-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormat } from '@/hooks/use-format';
import { cn } from '@/lib/utils';
import { approve, index, reject } from '@/routes/super-admin/billing';

type InvoiceStatus = 'open' | 'claimed' | 'paid' | 'canceled';

type Invoice = {
    id: number;
    organization: string;
    plan: string;
    cycle: 'monthly' | 'annual';
    amountCents: number;
    dueDate: string;
    status: InvoiceStatus;
    overdue: boolean;
    claimedAt: string | null;
    paidAt: string | null;
    rejectionReason: string | null;
    receiptType: 'image' | 'pdf' | null;
    receiptUrl: string | null;
};

type Filter = 'claimed' | 'open' | 'overdue' | 'paid' | 'all';

type Props = {
    invoices: {
        data: Invoice[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters: { filter: Filter; q: string };
    kpis: {
        claimed: number;
        open: number;
        overdue: number;
        receivedMonthCents: number;
    };
};

const TABS: Filter[] = ['claimed', 'open', 'overdue', 'paid', 'all'];

const BADGE_STYLES: Record<string, string> = {
    claimed: 'bg-chart-4/20 text-chart-4',
    open: 'bg-muted text-muted-foreground',
    overdue: 'bg-destructive/15 text-destructive',
    paid: 'bg-brand-soft text-brand',
    canceled: 'bg-muted text-muted-foreground',
};

function InvoiceBadge({ invoice }: { invoice: Invoice }) {
    const { t } = useTranslation('super');
    const key =
        invoice.overdue && invoice.status === 'open'
            ? 'overdue'
            : invoice.status;

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                BADGE_STYLES[key],
            )}
        >
            {t(`billing.status.${key}`)}
        </span>
    );
}

export default function Billing({ invoices, filters, kpis }: Props) {
    const { t } = useTranslation(['super', 'common']);
    const { money, shortDate } = useFormat();
    const [query, setQuery] = useState(filters.q);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const rejectForm = useForm({ reason: '' });
    const firstRender = useRef(true);

    // The list is re-fetched, so the open dialog is looked up by id to reflect the fresh status.
    const selected = invoices.data.find((row) => row.id === selectedId) ?? null;

    const visit = (next: { filter?: Filter; q?: string }) => {
        const merged = { ...filters, q: query, ...next };

        router.get(
            index().url,
            { filter: merged.filter, q: merged.q || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        const timer = setTimeout(() => visit({ q: query }), 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const close = () => {
        setSelectedId(null);
        setRejecting(false);
        rejectForm.reset();
        rejectForm.clearErrors();
    };

    const doApprove = (invoice: Invoice) =>
        router.post(
            approve.url({ invoice: invoice.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: close,
            },
        );

    const doReject = (invoice: Invoice) =>
        rejectForm.post(reject.url({ invoice: invoice.id }), {
            preserveScroll: true,
            onSuccess: close,
        });

    const stats = [
        { label: t('super:billing.kpis.claimed'), value: kpis.claimed },
        { label: t('super:billing.kpis.open'), value: kpis.open },
        { label: t('super:billing.kpis.overdue'), value: kpis.overdue },
        {
            label: t('super:billing.kpis.received'),
            value: money(kpis.receivedMonthCents),
        },
    ];

    return (
        <>
            <Head title={t('super:billing.title')} />

            <div className="space-y-6">
                <Heading
                    title={t('super:billing.heading')}
                    description={t('super:billing.description')}
                />

                <div className="grid grid-cols-2 gap-3 md:max-w-2xl md:grid-cols-4">
                    {stats.map((stat) => (
                        <Card key={stat.label} size="sm">
                            <CardHeader>
                                <CardTitle className="text-muted-foreground text-xs font-normal">
                                    {stat.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-2xl font-semibold tabular-nums">
                                {stat.value}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex max-w-3xl flex-col gap-2.5">
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('super:billing.searchPlaceholder')}
                        className="h-10 lg:w-[280px]"
                    />
                    <ChipRow>
                        {TABS.map((key) => (
                            <Chip
                                key={key}
                                active={filters.filter === key}
                                onClick={() => visit({ filter: key })}
                            >
                                {t(`super:billing.tabs.${key}`)}
                            </Chip>
                        ))}
                    </ChipRow>
                </div>

                {invoices.data.length === 0 ? (
                    <p className="text-muted-foreground py-10 text-center text-sm">
                        {t('super:billing.empty')}
                    </p>
                ) : (
                    <ul className="flex max-w-3xl flex-col gap-2">
                        {invoices.data.map((invoice) => (
                            <li key={invoice.id}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedId(invoice.id)}
                                    className="border-border hover:bg-muted/50 flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors lg:px-4 lg:py-3.5"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">
                                            {invoice.organization}
                                        </p>
                                        <p className="text-muted-foreground mt-0.5 text-xs">
                                            {t('super:billing.row.meta', {
                                                plan: invoice.plan,
                                                cycle: t(
                                                    `super:billing.cycle.${invoice.cycle}`,
                                                ),
                                                date: shortDate(
                                                    invoice.dueDate,
                                                ),
                                            })}
                                        </p>
                                    </div>
                                    {invoice.receiptUrl && (
                                        <PaperclipIcon
                                            className="text-muted-foreground size-4 shrink-0"
                                            aria-label={t(
                                                'super:billing.row.hasReceipt',
                                            )}
                                        />
                                    )}
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-sm font-bold tabular-nums">
                                            {money(invoice.amountCents)}
                                        </span>
                                        <InvoiceBadge invoice={invoice} />
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {invoices.last_page > 1 && (
                    <div className="flex max-w-3xl items-center justify-between gap-3">
                        <Button
                            variant="outline"
                            disabled={!invoices.prev_page_url}
                            onClick={() =>
                                invoices.prev_page_url &&
                                router.get(
                                    invoices.prev_page_url,
                                    {},
                                    { preserveState: true },
                                )
                            }
                        >
                            {t('super:billing.pagination.previous')}
                        </Button>
                        <span className="text-muted-foreground text-sm">
                            {t('super:billing.pagination.summary', {
                                current: invoices.current_page,
                                last: invoices.last_page,
                            })}
                        </span>
                        <Button
                            variant="outline"
                            disabled={!invoices.next_page_url}
                            onClick={() =>
                                invoices.next_page_url &&
                                router.get(
                                    invoices.next_page_url,
                                    {},
                                    { preserveState: true },
                                )
                            }
                        >
                            {t('super:billing.pagination.next')}
                        </Button>
                    </div>
                )}
            </div>

            <Dialog
                open={selected !== null}
                onOpenChange={(open) => !open && close()}
            >
                <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {selected.organization}
                                    <InvoiceBadge invoice={selected} />
                                </DialogTitle>
                                <DialogDescription>
                                    {t('super:billing.detail.description')}
                                </DialogDescription>
                            </DialogHeader>

                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="text-muted-foreground text-xs">
                                        {t('super:billing.detail.plan')}
                                    </dt>
                                    <dd>
                                        {selected.plan} ·{' '}
                                        {t(
                                            `super:billing.cycle.${selected.cycle}`,
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">
                                        {t('super:billing.detail.amount')}
                                    </dt>
                                    <dd className="font-semibold tabular-nums">
                                        {money(selected.amountCents)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">
                                        {t('super:billing.detail.due')}
                                    </dt>
                                    <dd>{shortDate(selected.dueDate)}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">
                                        {t('super:billing.detail.claimedAt')}
                                    </dt>
                                    <dd>
                                        {selected.claimedAt
                                            ? shortDate(selected.claimedAt)
                                            : '—'}
                                    </dd>
                                </div>
                                {selected.rejectionReason && (
                                    <div className="col-span-2">
                                        <dt className="text-muted-foreground text-xs">
                                            {t(
                                                'super:billing.detail.lastRejection',
                                            )}
                                        </dt>
                                        <dd>{selected.rejectionReason}</dd>
                                    </div>
                                )}
                            </dl>

                            {selected.receiptUrl && selected.receiptType ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setReceiptOpen(true)}
                                    >
                                        <PaperclipIcon />
                                        {t('super:billing.detail.viewReceipt')}
                                    </Button>
                                    <ReceiptViewer
                                        url={selected.receiptUrl}
                                        type={selected.receiptType}
                                        open={receiptOpen}
                                        onOpenChange={setReceiptOpen}
                                    />
                                </>
                            ) : (
                                selected.status === 'claimed' && (
                                    <p className="text-muted-foreground text-xs">
                                        {t('super:billing.detail.noReceipt')}
                                    </p>
                                )
                            )}

                            {(selected.status === 'claimed' ||
                                selected.status === 'open') &&
                                (rejecting ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="reject-reason">
                                            {t(
                                                'super:billing.detail.rejectReason',
                                            )}
                                        </Label>
                                        <Input
                                            id="reject-reason"
                                            value={rejectForm.data.reason}
                                            onChange={(event) =>
                                                rejectForm.setData(
                                                    'reason',
                                                    event.target.value,
                                                )
                                            }
                                            maxLength={255}
                                            autoFocus
                                        />
                                        <InputError
                                            message={rejectForm.errors.reason}
                                        />
                                        <DialogFooter>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setRejecting(false)
                                                }
                                            >
                                                {t('common:cancel')}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                disabled={rejectForm.processing}
                                                onClick={() =>
                                                    doReject(selected)
                                                }
                                            >
                                                {t(
                                                    'super:billing.detail.confirmReject',
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </div>
                                ) : (
                                    <DialogFooter>
                                        {selected.status === 'claimed' && (
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setRejecting(true)
                                                }
                                            >
                                                {t(
                                                    'super:billing.detail.reject',
                                                )}
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => doApprove(selected)}
                                        >
                                            <CheckCircleIcon />
                                            {selected.status === 'claimed'
                                                ? t(
                                                      'super:billing.detail.approve',
                                                  )
                                                : t(
                                                      'super:billing.detail.markPaid',
                                                  )}
                                        </Button>
                                    </DialogFooter>
                                ))}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
