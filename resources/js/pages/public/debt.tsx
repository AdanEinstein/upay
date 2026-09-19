import { Head } from '@inertiajs/react';
import { CopyIcon, CheckIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatDay, formatMoney } from '@/lib/money';

type Installment = {
    id: number;
    description: string;
    number: number;
    total: number;
    dueDate: string;
    amountCents: number;
    paidAt: string | null;
    overdue: boolean;
};

type Props = {
    store: string;
    customer: string;
    pixCode: string;
    installments: Installment[];
};

// ponytail: sample data; the controller resolves `customers.public_token` and passes real props.
const sample: Props = {
    store: 'Loja da Ana',
    customer: 'Maria Souza',
    pixCode: '00020126EXEMPLO-PIX-COPIA-E-COLA5204000053039865802BR5909LOJA DA ANA6009SAO PAULO62070503***6304ABCD',
    installments: [
        { id: 1, description: 'Vestido floral', number: 1, total: 3, dueDate: '2026-08-15', amountCents: 15000, paidAt: '2026-08-14', overdue: false },
        { id: 2, description: 'Vestido floral', number: 2, total: 3, dueDate: '2026-09-15', amountCents: 15000, paidAt: null, overdue: true },
        { id: 3, description: 'Vestido floral', number: 3, total: 3, dueDate: '2026-10-15', amountCents: 15000, paidAt: null, overdue: false },
        { id: 4, description: 'Bolsa', number: 1, total: 1, dueDate: '2026-09-30', amountCents: 20000, paidAt: null, overdue: false },
    ],
};

export default function Debt(props: Partial<Props>) {
    const { t, i18n } = useTranslation('public');
    const [, copy] = useClipboard();
    const [copied, setCopied] = useState(false);
    const data = { ...sample, ...props };
    const locale = i18n.language;

    const open = data.installments.filter((item) => item.paidAt === null);
    const paid = data.installments.filter((item) => item.paidAt !== null);
    const openCents = open.reduce((sum, item) => sum + item.amountCents, 0);

    async function copyPix() {
        if (!(await copy(data.pixCode))) {
            toast.error(t('public:copyFailed'));

            return;
        }

        toast.success(t('public:copied'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <>
            <Head title={t('public:title')}>
                <meta name="robots" content="noindex" />
            </Head>

            <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 bg-background p-4 pb-32">
                <header>
                    <p className="text-sm text-muted-foreground">{data.store}</p>
                    <h1 className="text-xl font-semibold">{t('public:greeting', { name: data.customer })}</h1>
                </header>

                <Card>
                    <CardContent className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">{t('public:totalOpen')}</span>
                        <span className="text-3xl font-bold tabular-nums">{formatMoney(openCents, locale)}</span>
                        {open.length === 0 && <span className="text-sm text-muted-foreground">{t('public:allPaid')}</span>}
                    </CardContent>
                </Card>

                {open.length > 0 && (
                    <section className="flex flex-col gap-2">
                        <h2 className="text-sm font-medium">{t('public:installments')}</h2>
                        <ul className="flex flex-col divide-y rounded-xl border">
                            {open.map((item) => (
                                <li key={item.id} className="flex items-center gap-3 p-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{item.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t('public:installmentOf', { number: item.number, total: item.total })} ·{' '}
                                            {t('public:dueOn', { date: formatDay(item.dueDate, locale) })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-sm font-semibold tabular-nums">{formatMoney(item.amountCents, locale)}</span>
                                        <Badge variant={item.overdue ? 'destructive' : 'secondary'}>
                                            {item.overdue ? t('public:overdue') : t('public:pending')}
                                        </Badge>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {paid.length > 0 && (
                    <section className="flex flex-col gap-2">
                        <h2 className="text-sm font-medium">{t('public:history')}</h2>
                        <ul className="flex flex-col divide-y rounded-xl border">
                            {paid.map((item) => (
                                <li key={item.id} className="flex items-center gap-3 p-3 text-muted-foreground">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm">{item.description}</p>
                                        <p className="text-xs">
                                            {t('public:installmentOf', { number: item.number, total: item.total })} ·{' '}
                                            {t('public:paidOn', { date: formatDay(item.paidAt!, locale) })}
                                        </p>
                                    </div>
                                    <span className="text-sm tabular-nums">{formatMoney(item.amountCents, locale)}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </main>

            {open.length > 0 && (
                <div className="fixed inset-x-0 bottom-0 border-t bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <div className="mx-auto flex max-w-md flex-col gap-2">
                        <Button className="h-12 text-base" onClick={copyPix}>
                            {copied ? <CheckIcon /> : <CopyIcon />}
                            {t('public:copyPix')}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">{t('public:pixHint')}</p>
                    </div>
                </div>
            )}
        </>
    );
}
