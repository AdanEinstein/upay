import { Head } from '@inertiajs/react';
import { PlusIcon, WarningIcon, ReceiptIcon, MoneyIcon, ShareNetworkIcon, UserPlusIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useTenant } from '@/hooks/use-tenant';
import i18n from '@/lib/i18n';
import { formatDay, formatMoney } from '@/lib/money';
import { dashboard } from '@/routes';

type Receivable = {
    id: number;
    customer: string;
    phone: string;
    publicToken: string;
    dueDate: string;
    amountCents: number;
    overdue: boolean;
};

type LowStockItem = { id: number; name: string; quantity: number };

type Props = {
    salesTodayCents: number;
    receivableCents: number;
    expensesMonthCents: number;
    profitMonthCents: number;
    receivables: Receivable[];
    lowStock: LowStockItem[];
};

// ponytail: sample data; the controller will pass these as Inertia props (see docs/database-schema.md).
const sample: Props = {
    salesTodayCents: 48750,
    receivableCents: 132000,
    expensesMonthCents: 61200,
    profitMonthCents: 274300,
    receivables: [
        { id: 1, customer: 'Maria Souza', phone: '5511999990001', publicToken: 'sample-token-1', dueDate: '2026-09-15', amountCents: 45000, overdue: true },
        { id: 2, customer: 'João Lima', phone: '5511999990002', publicToken: 'sample-token-2', dueDate: '2026-09-22', amountCents: 32000, overdue: false },
        { id: 3, customer: 'Ana Costa', phone: '5511999990003', publicToken: 'sample-token-3', dueDate: '2026-09-30', amountCents: 55000, overdue: false },
    ],
    lowStock: [
        { id: 1, name: 'Camiseta básica M', quantity: 2 },
        { id: 2, name: 'Perfume 50ml', quantity: 1 },
    ],
};

const whatsapp = (text: string, phone = '') => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

export default function Dashboard(props: Partial<Props>) {
    const { t, i18n: i18nInstance } = useTranslation('dashboard');
    const tenant = useTenant();
    const data = { ...sample, ...props };
    const locale = i18nInstance.language;
    const store = tenant?.name ?? t('dashboard:defaultStore');

    const stats = [
        { label: t('dashboard:stats.salesToday'), cents: data.salesTodayCents },
        { label: t('dashboard:stats.toReceive'), cents: data.receivableCents },
        { label: t('dashboard:stats.expensesMonth'), cents: data.expensesMonthCents },
        { label: t('dashboard:stats.profitMonth'), cents: data.profitMonthCents },
    ];

    const quickActions = [
        { label: t('dashboard:actions.registerSale'), icon: ReceiptIcon },
        { label: t('dashboard:actions.registerExpense'), icon: MoneyIcon },
        { label: t('dashboard:actions.addCustomer'), icon: UserPlusIcon },
    ];

    return (
        <>
            <Head title={t('dashboard:title')} />

            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-xl font-semibold">{t('dashboard:greeting', { store })}</h1>
                    <p className="text-sm text-muted-foreground">{t('dashboard:subtitle')}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {stats.map((stat) => (
                        <Card key={stat.label} size="sm">
                            <CardHeader>
                                <CardTitle className="text-xs font-normal text-muted-foreground">{stat.label}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-lg font-semibold tabular-nums">{formatMoney(stat.cents, locale)}</CardContent>
                        </Card>
                    ))}
                </div>

                {data.lowStock.length > 0 && (
                    <Alert>
                        <WarningIcon />
                        <AlertTitle>{t('dashboard:lowStock.title')}</AlertTitle>
                        <AlertDescription>
                            {data.lowStock.map((item) => (
                                <span key={item.id} className="block">
                                    {item.name} · {t('dashboard:lowStock.left', { count: item.quantity })}
                                </span>
                            ))}
                        </AlertDescription>
                    </Alert>
                )}

                <section className="flex flex-col gap-2">
                    <h2 className="text-sm font-medium">{t('dashboard:receivables.title')}</h2>
                    <ul className="flex flex-col divide-y rounded-xl border">
                        {data.receivables.map((item) => (
                            <li key={item.id} className="flex items-center gap-3 p-3">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{item.customer}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {t('dashboard:receivables.dueOn', { date: formatDay(item.dueDate, locale) })}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-sm font-semibold tabular-nums">{formatMoney(item.amountCents, locale)}</span>
                                    {item.overdue && <Badge variant="destructive">{t('dashboard:receivables.overdue')}</Badge>}
                                </div>
                                <Button asChild size="sm" variant="outline">
                                    <a
                                        href={whatsapp(
                                            t('dashboard:receivables.chargeText', {
                                                name: item.customer,
                                                url: `${window.location.origin}/p/${item.publicToken}`,
                                            }),
                                            item.phone,
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {t('dashboard:receivables.charge')}
                                    </a>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            {/* Thumb zone: primary actions stay pinned to the bottom edge. */}
            <div className="sticky bottom-0 mt-auto border-t bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <div className="mx-auto flex max-w-2xl gap-2">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button className="h-12 flex-1 text-base">
                                <PlusIcon />
                                {t('dashboard:actions.newSale')}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
                            <SheetHeader>
                                <SheetTitle>{t('dashboard:actions.quickTitle')}</SheetTitle>
                                <SheetDescription>{t('dashboard:actions.quickDescription')}</SheetDescription>
                            </SheetHeader>
                            <div className="flex flex-col gap-2 px-6 pb-6">
                                {quickActions.map((action) => (
                                    <SheetClose key={action.label} asChild>
                                        <Button variant="outline" className="h-12 justify-start text-base">
                                            <action.icon />
                                            {action.label}
                                        </Button>
                                    </SheetClose>
                                ))}
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Button asChild variant="outline" className="h-12 px-4" aria-label={t('dashboard:actions.shareCatalog')}>
                        <a href={whatsapp(t('dashboard:actions.shareCatalogText', { store }))} target="_blank" rel="noreferrer">
                            <ShareNetworkIcon />
                        </a>
                    </Button>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: i18n.t('dashboard:title'),
            href: dashboard(),
        },
    ],
};
