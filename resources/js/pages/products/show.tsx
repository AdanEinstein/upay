import { Head, Link, useForm } from '@inertiajs/react';
import { MinusIcon, PencilSimpleIcon, PlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@/components/shop/bottom-sheet';
import { Chip } from '@/components/shop/chip';
import PageHeader from '@/components/shop/page-header';
import ProductImage from '@/components/shop/product-image';
import { Button } from '@/components/ui/button';
import { useFormat } from '@/hooks/use-format';
import { cn } from '@/lib/utils';
import { edit, index } from '@/routes/products';
import { store as restock } from '@/routes/products/stock';
import { show as showSale } from '@/routes/sales';

type Props = {
    product: {
        id: number;
        name: string;
        priceCents: number;
        costCents: number | null;
        stock: number;
        minStock: number;
        images: string[];
        variants: { id: number; name: string; stock: number }[];
    };
    movements: {
        id: number;
        delta: number;
        reason: 'sale' | 'adjustment' | 'return';
        saleId: number | null;
        variant: string | null;
        at: string;
    }[];
};

export default function ShowProduct({ product, movements }: Props) {
    const { t } = useTranslation('shop');
    const { money, shortDate } = useFormat();
    const [image, setImage] = useState(0);
    const [open, setOpen] = useState(false);
    const form = useForm({
        quantity: 5,
        variant_id: product.variants[0]?.id ?? null,
    });

    const margin =
        product.costCents !== null && product.priceCents > 0
            ? Math.round(
                  ((product.priceCents - product.costCents) /
                      product.priceCents) *
                      100,
              )
            : null;
    const isLow = (stock: number) => stock <= product.minStock;

    return (
        <>
            <Head title={product.name} />
            <PageHeader
                title=""
                back={index.url()}
                action={
                    <Button
                        asChild
                        variant="outline"
                        size="icon-sm"
                        aria-label={t('common.edit')}
                    >
                        <Link href={edit.url({ product: product.id })}>
                            <PencilSimpleIcon />
                        </Link>
                    </Button>
                }
            />

            <div className="flex flex-col gap-4 px-5 lg:grid lg:grid-cols-[340px_1fr] lg:items-start lg:gap-8">
                <div className="flex flex-col gap-4">
                    <ProductImage
                        url={product.images[image] ?? null}
                        className="h-[220px] w-full rounded-2xl lg:h-[280px]"
                        iconClassName="size-10"
                    />
                    {product.images.length > 1 && (
                        <div className="flex gap-2">
                            {product.images.map((url, position) => (
                                <button
                                    key={url}
                                    type="button"
                                    onClick={() => setImage(position)}
                                    className={cn(
                                        'size-14 overflow-hidden rounded-lg border-2',
                                        position === image
                                            ? 'border-brand'
                                            : 'border-transparent',
                                    )}
                                >
                                    <img
                                        src={url}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <p className="text-[17px] font-bold lg:text-xl">
                            {product.name}
                        </p>
                        <p className="mt-1 text-xl font-bold lg:text-2xl">
                            {money(product.priceCents)}
                        </p>
                        {margin !== null && (
                            <p className="text-muted-foreground mt-0.5 text-[12.5px]">
                                {t('products.detail.cost', {
                                    cost: money(product.costCents!),
                                    margin,
                                })}
                            </p>
                        )}
                    </div>

                    <div>
                        <p className="text-muted-foreground mb-2 text-[13px] font-semibold">
                            {product.variants.length > 0
                                ? t('products.detail.stockByVariant')
                                : t('products.detail.stock')}
                        </p>
                        <div className="border-border divide-border divide-y overflow-hidden rounded-2xl border lg:max-w-[320px]">
                            {(product.variants.length > 0
                                ? product.variants
                                : [
                                      {
                                          id: 0,
                                          name: product.name,
                                          stock: product.stock,
                                      },
                                  ]
                            ).map((row) => (
                                <div
                                    key={row.id}
                                    className="flex justify-between px-3 py-2.5 text-[13.5px]"
                                >
                                    <span>{row.name}</span>
                                    <span
                                        className={cn(
                                            'font-semibold',
                                            isLow(row.stock) &&
                                                'text-destructive',
                                        )}
                                    >
                                        {t('products.detail.units', {
                                            count: row.stock,
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="lg"
                        className="h-11 text-[14.5px] lg:self-start lg:px-5"
                        onClick={() => setOpen(true)}
                    >
                        {t('products.detail.restock')}
                    </Button>

                    <div>
                        <p className="text-muted-foreground mb-2 text-[13px] font-semibold">
                            {t('products.detail.history')}
                        </p>
                        {movements.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                {t('products.detail.noHistory')}
                            </p>
                        ) : (
                            <div className="flex flex-col">
                                {movements.map((movement) => (
                                    <div
                                        key={movement.id}
                                        className="border-border flex justify-between border-b py-1.5 text-[13px] last:border-b-0"
                                    >
                                        <span
                                            className={
                                                movement.delta < 0
                                                    ? 'text-destructive'
                                                    : 'text-brand'
                                            }
                                        >
                                            {movement.delta > 0 ? '+' : '−'}
                                            {Math.abs(movement.delta)} ·{' '}
                                            {movement.reason === 'sale' &&
                                            movement.saleId ? (
                                                <Link
                                                    href={showSale.url({
                                                        sale: movement.saleId,
                                                    })}
                                                    className="underline"
                                                >
                                                    {t(
                                                        'products.detail.reason.sale',
                                                        { id: movement.saleId },
                                                    )}
                                                </Link>
                                            ) : (
                                                t(
                                                    `products.detail.reason.${movement.reason}`,
                                                    { id: movement.saleId },
                                                )
                                            )}
                                            {movement.variant &&
                                                ` (${movement.variant})`}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {shortDate(movement.at)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <BottomSheet
                open={open}
                onOpenChange={setOpen}
                title={t('products.detail.restockTitle')}
            >
                {product.variants.length > 0 && (
                    <div
                        className="flex flex-wrap gap-2"
                        role="group"
                        aria-label={t('products.detail.restockVariant')}
                    >
                        {product.variants.map((variant) => (
                            <Chip
                                key={variant.id}
                                active={form.data.variant_id === variant.id}
                                onClick={() =>
                                    form.setData('variant_id', variant.id)
                                }
                            >
                                {variant.name}
                            </Chip>
                        ))}
                    </div>
                )}
                <div className="flex items-center justify-center gap-5">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        aria-label={t('newSale.products.remove')}
                        onClick={() =>
                            form.setData(
                                'quantity',
                                Math.max(1, form.data.quantity - 1),
                            )
                        }
                    >
                        <MinusIcon />
                    </Button>
                    <span className="min-w-10 text-center text-2xl font-bold">
                        {form.data.quantity}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        aria-label={t('newSale.products.add')}
                        onClick={() =>
                            form.setData(
                                'quantity',
                                Math.min(50, form.data.quantity + 1),
                            )
                        }
                    >
                        <PlusIcon />
                    </Button>
                </div>
                <Button
                    size="lg"
                    className="h-12 text-base"
                    disabled={form.processing}
                    onClick={() =>
                        form.post(restock.url({ product: product.id }), {
                            preserveScroll: true,
                            onSuccess: () => setOpen(false),
                        })
                    }
                >
                    {t('products.detail.restockConfirm')}
                </Button>
            </BottomSheet>
        </>
    );
}
