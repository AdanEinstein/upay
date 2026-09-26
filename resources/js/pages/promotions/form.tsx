import { Head, router, useForm } from '@inertiajs/react';
import { CheckIcon, MinusIcon, PlusIcon } from '@phosphor-icons/react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import DateInput from '@/components/date-input';
import InputError from '@/components/input-error';
import MoneyInput from '@/components/money-input';
import { Chip } from '@/components/shop/chip';
import PageHeader from '@/components/shop/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFormat } from '@/hooks/use-format';
import { cn } from '@/lib/utils';
import { destroy, index, store, update } from '@/routes/promotions';

type Product = { id: number; name: string; priceCents: number };
type Promotion = {
    id: number;
    type: 'percent' | 'price';
    percent: number | null;
    originalPriceCents: number | null;
    promoPriceCents: number | null;
    startsOn: string | null;
    endsOn: string | null;
    productIds: number[];
};

export default function PromotionForm({
    promotion,
    products,
}: {
    promotion: Promotion | null;
    products: Product[];
}) {
    const { t } = useTranslation('shop');
    const { money } = useFormat();
    const form = useForm({
        product_ids: promotion?.productIds ?? ([] as number[]),
        type: promotion?.type ?? ('percent' as 'percent' | 'price'),
        percent: promotion?.percent ?? 20,
        original_price_cents: (promotion?.originalPriceCents ?? null) as
            | number
            | null,
        promo_price_cents: (promotion?.promoPriceCents ?? null) as
            | number
            | null,
        starts_on: promotion?.startsOn ?? '',
        ends_on: promotion?.endsOn ?? '',
    });

    function toggle(product: Product) {
        const selected = form.data.product_ids.includes(product.id);
        form.setData((data) => ({
            ...data,
            product_ids: selected
                ? data.product_ids.filter((id) => id !== product.id)
                : [...data.product_ids, product.id],
            original_price_cents:
                data.original_price_cents ?? product.priceCents,
        }));
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            percent: data.type === 'percent' ? data.percent : null,
            original_price_cents:
                data.type === 'price' ? data.original_price_cents : null,
            promo_price_cents:
                data.type === 'price' ? data.promo_price_cents : null,
            starts_on: data.starts_on || null,
            ends_on: data.ends_on || null,
        }));

        if (promotion) {
            form.put(update.url({ promotion: promotion.id }));
        } else {
            form.post(store.url());
        }
    }

    const title = promotion
        ? t('promotions.form.editTitle')
        : t('promotions.form.newTitle');
    const errors = form.errors as Record<string, string>;

    return (
        <>
            <Head title={title} />
            <PageHeader title={title} back={index.url()} />

            <form onSubmit={submit} className="flex flex-col gap-4 px-5 pt-2">
                <div>
                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">
                        {t('promotions.form.products')}
                    </p>
                    <div className="flex flex-col gap-1.5">
                        {products.map((product) => {
                            const selected = form.data.product_ids.includes(
                                product.id,
                            );

                            return (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => toggle(product)}
                                    aria-pressed={selected}
                                    className={cn(
                                        'flex items-center gap-2.5 rounded-[10px] border px-2.5 py-2 text-left',
                                        selected
                                            ? 'border-brand bg-brand-soft'
                                            : 'border-border bg-card',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-2',
                                            selected
                                                ? 'border-brand bg-brand text-brand-foreground'
                                                : 'border-border',
                                        )}
                                    >
                                        {selected && (
                                            <CheckIcon
                                                className="size-3"
                                                weight="bold"
                                            />
                                        )}
                                    </span>
                                    <span className="flex-1 text-[13.5px]">
                                        {product.name}
                                    </span>
                                    <span className="text-muted-foreground text-[12.5px]">
                                        {money(product.priceCents)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <InputError message={errors.product_ids} />
                </div>

                <div>
                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">
                        {t('promotions.form.type')}
                    </p>
                    <div className="flex gap-2">
                        {(['percent', 'price'] as const).map((key) => (
                            <Chip
                                key={key}
                                active={form.data.type === key}
                                onClick={() => form.setData('type', key)}
                            >
                                {t(`promotions.form.types.${key}`)}
                            </Chip>
                        ))}
                    </div>
                </div>

                {form.data.type === 'percent' ? (
                    <div className="bg-card border-border flex items-center justify-between rounded-2xl border p-3.5">
                        <span className="text-sm font-semibold">
                            {t('promotions.form.discount')}
                        </span>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                aria-label={t('newSale.products.remove')}
                                onClick={() =>
                                    form.setData(
                                        'percent',
                                        Math.max(5, form.data.percent - 5),
                                    )
                                }
                            >
                                <MinusIcon />
                            </Button>
                            <span className="min-w-9 text-center text-[15px] font-bold">
                                {form.data.percent}%
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                aria-label={t('newSale.products.add')}
                                onClick={() =>
                                    form.setData(
                                        'percent',
                                        Math.min(70, form.data.percent + 5),
                                    )
                                }
                            >
                                <PlusIcon />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="from">
                                {t('promotions.form.from')}
                            </Label>
                            <MoneyInput
                                id="from"
                                cents={form.data.original_price_cents}
                                onCentsChange={(cents) =>
                                    form.setData('original_price_cents', cents)
                                }
                                className="h-10"
                            />
                            <InputError
                                message={form.errors.original_price_cents}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="to">
                                {t('promotions.form.to')}
                            </Label>
                            <MoneyInput
                                id="to"
                                cents={form.data.promo_price_cents}
                                onCentsChange={(cents) =>
                                    form.setData('promo_price_cents', cents)
                                }
                                className="h-10"
                            />
                            <InputError
                                message={form.errors.promo_price_cents}
                            />
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <Label>{t('promotions.form.validity')}</Label>
                    <div className="grid grid-cols-2 gap-2.5">
                        <DateInput
                            aria-label={t('promotions.form.start')}
                            value={form.data.starts_on}
                            onValueChange={(value) =>
                                form.setData('starts_on', value)
                            }
                            className="h-10"
                        />
                        <DateInput
                            aria-label={t('promotions.form.end')}
                            value={form.data.ends_on}
                            onValueChange={(value) =>
                                form.setData('ends_on', value)
                            }
                            className="h-10"
                        />
                    </div>
                    <InputError
                        message={form.errors.starts_on || form.errors.ends_on}
                    />
                </div>

                <div>
                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">
                        {t('promotions.form.badgePreview')}
                    </p>
                    <span className="bg-destructive inline-block rounded-lg px-3 py-1.5 text-[13px] font-bold text-white">
                        {form.data.type === 'percent'
                            ? `-${form.data.percent}%`
                            : t('promotions.form.priceBadgePreview', {
                                  from: money(
                                      form.data.original_price_cents ?? 0,
                                  ),
                                  to: money(form.data.promo_price_cents ?? 0),
                              })}
                    </span>
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="h-12 text-base"
                    disabled={form.processing}
                >
                    {t('promotions.form.save')}
                </Button>
                {promotion && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive h-10"
                        onClick={() =>
                            router.delete(
                                destroy.url({ promotion: promotion.id }),
                            )
                        }
                    >
                        {t('promotions.form.delete')}
                    </Button>
                )}
            </form>
        </>
    );
}
