import { Head, useForm } from '@inertiajs/react';
import {
    CameraIcon,
    CaretLeftIcon,
    CheckIcon,
    MinusIcon,
    PlusIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DateInput from '@/components/date-input';
import InputError from '@/components/input-error';
import MoneyInput from '@/components/money-input';
import { Chip, ChipRow } from '@/components/shop/chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormat } from '@/hooks/use-format';
import { useInitials } from '@/hooks/use-initials';
import { maskPhone } from '@/lib/mask';
import { cn } from '@/lib/utils';
import { store as storeCustomer } from '@/routes/customers';
import { store } from '@/routes/sales';

type Customer = { id: number; name: string; phone: string | null };
type Sellable = {
    key: string;
    productId: number;
    variantId: number | null;
    name: string;
    category: string | null;
    priceCents: number;
    stock: number;
    imageUrl: string | null;
};
type PaymentType = 'avista' | 'fiado' | 'parcelado';

const METHODS = ['pix', 'cash', 'card'] as const;

const isoToday = () => new Date().toLocaleDateString('en-CA');

// Same rule as the server: the day is clamped to the target month's length.
function addMonths(iso: string, months: number): string {
    const [year, month, day] = iso.split('-').map(Number);
    const target = new Date(year, month - 1 + months, 1);
    const lastDay = new Date(
        target.getFullYear(),
        target.getMonth() + 1,
        0,
    ).getDate();
    target.setDate(Math.min(day, lastDay));

    return target.toLocaleDateString('en-CA');
}

function splitInstallments(
    totalCents: number,
    count: number,
    firstDue: string,
) {
    const base = Math.round(totalCents / count);

    return Array.from({ length: count }, (_, index) => ({
        number: index + 1,
        date: addMonths(firstDue, index),
        cents: index === count - 1 ? totalCents - base * (count - 1) : base,
    }));
}

export default function CreateSale({
    customers,
    selectedCustomerId,
    sellables,
    categories,
}: {
    customers: Customer[];
    selectedCustomerId: number | null;
    sellables: Sellable[];
    categories: string[];
}) {
    const { t } = useTranslation('shop');
    const { money, shortDate } = useFormat();
    const getInitials = useInitials();
    const [step, setStep] = useState<1 | 2 | 3>(selectedCustomerId ? 2 : 1);
    const [customerId, setCustomerId] = useState<number | null>(
        selectedCustomerId,
    );
    const [customerQuery, setCustomerQuery] = useState('');
    const [showNewCustomer, setShowNewCustomer] = useState(false);
    const [productQuery, setProductQuery] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [cart, setCart] = useState<Record<string, number>>({});
    const [paymentType, setPaymentType] = useState<PaymentType>('avista');
    const [installments, setInstallments] = useState(3);
    const [downPayment, setDownPayment] = useState<number | null>(null);
    const [firstDue, setFirstDue] = useState(() => addMonths(isoToday(), 1));
    const [method, setMethod] = useState<(typeof METHODS)[number]>('pix');

    const newCustomer = useForm({ name: '', phone: '', from: 'sale' });
    const sale = useForm({});

    const customer = customers.find((item) => item.id === customerId) ?? null;
    const lines = sellables.filter((item) => cart[item.key] > 0);
    const totalCents = lines.reduce(
        (sum, item) => sum + item.priceCents * cart[item.key],
        0,
    );
    const itemCount = lines.reduce((sum, item) => sum + cart[item.key], 0);
    const itemCountLabel = t('newSale.products.itemCount', {
        count: itemCount,
    });
    const entry = Math.min(downPayment ?? 0, totalCents);
    const plan = splitInstallments(totalCents - entry, installments, firstDue);

    const needle = customerQuery.trim().toLowerCase();
    const visibleCustomers = customers.filter((item) =>
        item.name.toLowerCase().includes(needle),
    );
    const productNeedle = productQuery.trim().toLowerCase();
    const visibleSellables = sellables.filter(
        (item) =>
            item.name.toLowerCase().includes(productNeedle) &&
            (category === null || item.category === category),
    );

    function setQuantity(item: Sellable, quantity: number) {
        setCart((current) => ({
            ...current,
            [item.key]: Math.max(0, Math.min(item.stock, quantity)),
        }));
    }

    function confirm() {
        sale.transform(() => ({
            customer_id: customerId,
            items: lines.map((item) => ({
                product_id: item.productId,
                variant_id: item.variantId,
                quantity: cart[item.key],
            })),
            payment_type: paymentType,
            payment_method: method,
            installments: paymentType === 'parcelado' ? installments : null,
            down_payment_cents: paymentType === 'parcelado' ? entry : null,
            first_due_date: paymentType === 'parcelado' ? firstDue : null,
        }));
        sale.post(store.url());
    }

    function back() {
        if (step === 1) {
            window.history.back();
        } else {
            setStep((step - 1) as 1 | 2);
        }
    }

    const saleErrors = sale.errors as Record<string, string>;
    const error = Object.values(saleErrors)[0];

    return (
        <>
            <Head title={t('nav.newSale')} />

            {/* Desktop: the flow is a modal over the app (prototype), mobile stays a full page. */}
            <div className="flex flex-1 flex-col lg:fixed lg:inset-0 lg:z-40 lg:flex-row lg:items-center lg:justify-center lg:bg-black/45 lg:p-6">
                <div
                    className={cn(
                        'lg:bg-card flex flex-1 flex-col lg:max-h-[700px] lg:flex-none lg:overflow-y-auto lg:rounded-2xl lg:px-2 lg:py-6',
                        step === 2 ? 'lg:w-[600px]' : 'lg:w-[480px]',
                    )}
                >
                    <div className="flex items-center gap-2.5 px-4 py-3 lg:px-5 lg:pt-0">
                        <button
                            type="button"
                            onClick={back}
                            aria-label={t('common.back')}
                            className="border-border bg-card inline-flex size-8 items-center justify-center rounded-full border"
                        >
                            <CaretLeftIcon className="size-4" />
                        </button>
                        <div className="flex flex-1 gap-1.5">
                            {[1, 2, 3].map((segment) => (
                                <span
                                    key={segment}
                                    className={cn(
                                        'h-1 flex-1 rounded-sm',
                                        step >= segment
                                            ? 'bg-brand'
                                            : 'bg-border',
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {step === 1 && (
                        <>
                            <div className="flex flex-1 flex-col gap-4 px-5 pb-4">
                                <h1 className="font-heading text-[19px] font-bold">
                                    {t('newSale.customer.title')}
                                </h1>
                                <Input
                                    value={customerQuery}
                                    onChange={(event) =>
                                        setCustomerQuery(event.target.value)
                                    }
                                    placeholder={t('newSale.customer.search')}
                                    className="h-11"
                                />
                                <div>
                                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">
                                        {t('newSale.customer.recent')}
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        {visibleCustomers
                                            .slice(0, 20)
                                            .map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setCustomerId(item.id)
                                                    }
                                                    className={cn(
                                                        'flex items-center gap-2.5 rounded-xl border p-2.5 text-left',
                                                        item.id === customerId
                                                            ? 'border-brand bg-brand-soft'
                                                            : 'border-border bg-card',
                                                    )}
                                                >
                                                    <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold">
                                                        {getInitials(item.name)}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-medium">
                                                            {item.name}
                                                        </span>
                                                        <span className="text-muted-foreground block text-xs">
                                                            {item.phone}
                                                        </span>
                                                    </span>
                                                    {item.id === customerId && (
                                                        <CheckIcon
                                                            className="text-brand size-[18px]"
                                                            weight="bold"
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNewCustomer(!showNewCustomer)
                                    }
                                    className="text-brand border-border flex items-center gap-2 rounded-xl border border-dashed p-3 text-sm font-semibold"
                                >
                                    <PlusIcon className="size-4" />
                                    {t('newSale.customer.new')}
                                </button>
                                {showNewCustomer && (
                                    <form
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            newCustomer.post(
                                                storeCustomer.url(),
                                            );
                                        }}
                                        className="bg-card border-border flex flex-col gap-2.5 rounded-2xl border p-3.5"
                                    >
                                        <Input
                                            value={newCustomer.data.name}
                                            onChange={(event) =>
                                                newCustomer.setData(
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={t(
                                                'newSale.customer.name',
                                            )}
                                            aria-label={t(
                                                'newSale.customer.name',
                                            )}
                                            className="h-10"
                                        />
                                        <InputError
                                            message={newCustomer.errors.name}
                                        />
                                        <Input
                                            type="tel"
                                            value={newCustomer.data.phone}
                                            onChange={(event) =>
                                                newCustomer.setData(
                                                    'phone',
                                                    maskPhone(
                                                        event.target.value,
                                                    ),
                                                )
                                            }
                                            placeholder={t(
                                                'newSale.customer.whatsapp',
                                            )}
                                            aria-label={t(
                                                'newSale.customer.whatsapp',
                                            )}
                                            inputMode="tel"
                                            className="h-10"
                                        />
                                        <InputError
                                            message={newCustomer.errors.phone}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={newCustomer.processing}
                                            className="h-10"
                                        >
                                            {t('newSale.customer.add')}
                                        </Button>
                                    </form>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCustomerId(null);
                                        setStep(2);
                                    }}
                                    className="text-muted-foreground text-[13px] underline underline-offset-4"
                                >
                                    {t('newSale.customer.skip')}
                                </button>
                            </div>
                            <div className="bg-background border-border sticky bottom-0 mt-auto border-t px-5 py-3 lg:static lg:border-t-0 lg:bg-transparent">
                                <Button
                                    size="lg"
                                    className="h-12 w-full text-base"
                                    disabled={customerId === null}
                                    onClick={() => setStep(2)}
                                >
                                    {t('newSale.continue')}
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="flex flex-1 flex-col gap-3.5 px-5 pb-4">
                                <h1 className="font-heading text-[19px] font-bold">
                                    {t('newSale.products.title')}
                                </h1>
                                <Input
                                    value={productQuery}
                                    onChange={(event) =>
                                        setProductQuery(event.target.value)
                                    }
                                    placeholder={t('newSale.products.search')}
                                    className="h-11"
                                />
                                {categories.length > 0 && (
                                    <ChipRow>
                                        <Chip
                                            active={category === null}
                                            onClick={() => setCategory(null)}
                                        >
                                            {t('newSale.products.all')}
                                        </Chip>
                                        {categories.map((item) => (
                                            <Chip
                                                key={item}
                                                active={category === item}
                                                onClick={() =>
                                                    setCategory(item)
                                                }
                                            >
                                                {item}
                                            </Chip>
                                        ))}
                                    </ChipRow>
                                )}
                                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                                    {visibleSellables.map((item) => {
                                        const quantity = cart[item.key] ?? 0;

                                        return (
                                            <div
                                                key={item.key}
                                                className="border-border bg-card relative overflow-hidden rounded-2xl border"
                                            >
                                                <div className="bg-muted text-muted-foreground flex h-24 items-center justify-center">
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt=""
                                                            className="size-full object-cover"
                                                        />
                                                    ) : (
                                                        <CameraIcon className="size-[26px]" />
                                                    )}
                                                </div>
                                                <div className="px-2.5 pt-2 pb-2.5">
                                                    <p className="mb-0.5 text-[12.5px] leading-tight font-semibold">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-muted-foreground text-[12.5px]">
                                                        {item.stock === 0
                                                            ? t(
                                                                  'newSale.products.outOfStock',
                                                              )
                                                            : money(
                                                                  item.priceCents,
                                                              )}
                                                    </p>
                                                </div>
                                                {item.stock > 0 &&
                                                    (quantity > 0 ? (
                                                        <div className="bg-brand absolute right-2 bottom-2 flex items-center gap-1.5 rounded-full p-[3px]">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setQuantity(
                                                                        item,
                                                                        quantity -
                                                                            1,
                                                                    )
                                                                }
                                                                aria-label={t(
                                                                    'newSale.products.remove',
                                                                )}
                                                                className="bg-brand-foreground text-brand flex size-[22px] items-center justify-center rounded-full"
                                                            >
                                                                <MinusIcon
                                                                    className="size-3"
                                                                    weight="bold"
                                                                />
                                                            </button>
                                                            <span className="text-brand-foreground min-w-3 text-center text-[13px] font-bold">
                                                                {quantity}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setQuantity(
                                                                        item,
                                                                        quantity +
                                                                            1,
                                                                    )
                                                                }
                                                                aria-label={t(
                                                                    'newSale.products.add',
                                                                )}
                                                                className="bg-brand-foreground text-brand flex size-[22px] items-center justify-center rounded-full"
                                                            >
                                                                <PlusIcon
                                                                    className="size-3"
                                                                    weight="bold"
                                                                />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setQuantity(
                                                                    item,
                                                                    1,
                                                                )
                                                            }
                                                            aria-label={t(
                                                                'newSale.products.add',
                                                            )}
                                                            className="bg-brand text-brand-foreground absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-full"
                                                        >
                                                            <PlusIcon
                                                                className="size-[15px]"
                                                                weight="bold"
                                                            />
                                                        </button>
                                                    ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="bg-background border-border sticky bottom-0 mt-auto flex items-center gap-3 border-t px-5 py-3 lg:static lg:bg-transparent">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-[11px]">
                                        {itemCountLabel}
                                    </p>
                                    <p className="text-base font-bold">
                                        {money(totalCents)}
                                    </p>
                                </div>
                                <Button
                                    size="lg"
                                    className="h-12 px-6 text-base"
                                    disabled={itemCount === 0}
                                    onClick={() => setStep(3)}
                                >
                                    {t('newSale.continue')}
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="flex flex-1 flex-col gap-4 px-5 pb-4">
                                <h1 className="font-heading text-[19px] font-bold">
                                    {t('newSale.payment.title')}
                                </h1>
                                <div className="flex gap-2">
                                    {(['avista', 'fiado', 'parcelado'] as const)
                                        .filter(
                                            (type) =>
                                                type === 'avista' ||
                                                customerId !== null,
                                        )
                                        .map((type) => (
                                            <Chip
                                                key={type}
                                                active={paymentType === type}
                                                onClick={() =>
                                                    setPaymentType(type)
                                                }
                                                className="px-4 py-2 text-[13.5px]"
                                            >
                                                {t(
                                                    `newSale.payment.types.${type}`,
                                                )}
                                            </Chip>
                                        ))}
                                </div>

                                {paymentType === 'parcelado' && (
                                    <div className="bg-card border-border lg:bg-background flex flex-col gap-3 rounded-2xl border p-3.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold">
                                                {t(
                                                    'newSale.payment.installments',
                                                )}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon-sm"
                                                    aria-label={t(
                                                        'newSale.products.remove',
                                                    )}
                                                    onClick={() =>
                                                        setInstallments(
                                                            Math.max(
                                                                2,
                                                                installments -
                                                                    1,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <MinusIcon />
                                                </Button>
                                                <span className="min-w-4 text-center text-[15px] font-bold">
                                                    {installments}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon-sm"
                                                    aria-label={t(
                                                        'newSale.products.add',
                                                    )}
                                                    onClick={() =>
                                                        setInstallments(
                                                            Math.min(
                                                                12,
                                                                installments +
                                                                    1,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <PlusIcon />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="down-payment">
                                                {t(
                                                    'newSale.payment.downPayment',
                                                )}
                                            </Label>
                                            <MoneyInput
                                                id="down-payment"
                                                cents={downPayment}
                                                onCentsChange={setDownPayment}
                                                placeholder="R$ 0,00"
                                                className="h-10"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="first-due">
                                                {t('newSale.payment.firstDue')}
                                            </Label>
                                            <DateInput
                                                id="first-due"
                                                min={isoToday()}
                                                value={firstDue}
                                                onValueChange={setFirstDue}
                                                className="h-10"
                                            />
                                            <InputError
                                                message={
                                                    saleErrors.first_due_date
                                                }
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-muted-foreground mb-0.5 text-[12.5px] font-semibold">
                                                {t('newSale.payment.preview')}
                                            </p>
                                            {plan.map((item) => (
                                                <div
                                                    key={item.number}
                                                    className="border-border flex justify-between border-t py-1 text-[13px]"
                                                >
                                                    <span>
                                                        {t(
                                                            'newSale.payment.previewLine',
                                                            {
                                                                number: item.number,
                                                                date: shortDate(
                                                                    item.date,
                                                                ),
                                                            },
                                                        )}
                                                    </span>
                                                    <span className="font-semibold">
                                                        {money(item.cents)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">
                                        {t('newSale.payment.method')}
                                    </p>
                                    <div className="flex gap-2">
                                        {METHODS.map((item) => (
                                            <Chip
                                                key={item}
                                                active={method === item}
                                                onClick={() => setMethod(item)}
                                                className="px-4 py-2 text-[13.5px]"
                                            >
                                                {t(`methods.${item}`)}
                                            </Chip>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-muted flex flex-col gap-1.5 rounded-2xl p-3.5">
                                    <div className="text-muted-foreground flex justify-between text-[13px]">
                                        <span>
                                            {t(
                                                'newSale.payment.summaryCustomer',
                                            )}
                                        </span>
                                        <span className="text-foreground font-medium">
                                            {customer?.name ??
                                                t('newSale.payment.noCustomer')}
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground flex justify-between text-[13px]">
                                        <span>
                                            {t('newSale.payment.summaryItems')}
                                        </span>
                                        <span className="text-foreground font-medium">
                                            {itemCountLabel}
                                        </span>
                                    </div>
                                    <div className="border-border flex justify-between border-t pt-1.5 text-[15px] font-bold">
                                        <span>
                                            {t('newSale.payment.summaryTotal')}
                                        </span>
                                        <span>{money(totalCents)}</span>
                                    </div>
                                </div>
                                <InputError message={error} />
                            </div>
                            <div className="bg-background border-border sticky bottom-0 mt-auto border-t px-5 py-3 lg:static lg:border-t-0 lg:bg-transparent">
                                <Button
                                    size="lg"
                                    className="h-12 w-full text-base"
                                    disabled={sale.processing}
                                    onClick={confirm}
                                >
                                    {t('newSale.payment.confirm')}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
