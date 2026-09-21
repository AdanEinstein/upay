import { Head, Link, useForm } from '@inertiajs/react';
import { CameraIcon, PlusIcon, XIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import MoneyInput from '@/components/money-input';
import { Chip } from '@/components/shop/chip';
import PageHeader from '@/components/shop/page-header';
import Textarea from '@/components/shop/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { index, show, store, update } from '@/routes/products';

type Product = {
    id: number;
    name: string;
    description: string | null;
    category: string | null;
    price_cents: number;
    cost_cents: number | null;
    stock_qty: number;
    min_stock: number;
    catalog_visible: boolean;
    images: { id: number; url: string }[];
    variants: { id: number; name: string; stock_qty: number }[];
};

type Variant = { id?: number; name: string; stock_qty: number };

const MAX_PHOTOS = 4;

export default function ProductForm({ product, categories }: { product: Product | null; categories: string[] }) {
    const { t } = useTranslation('shop');
    const [previews, setPreviews] = useState<string[]>([]);
    const form = useForm({
        name: product?.name ?? '',
        description: product?.description ?? '',
        category: product?.category ?? '',
        price_cents: (product?.price_cents ?? null) as number | null,
        cost_cents: (product?.cost_cents ?? null) as number | null,
        stock_qty: product?.stock_qty ?? 0,
        min_stock: product?.min_stock ?? 0,
        catalog_visible: product?.catalog_visible ?? true,
        variants: (product?.variants ?? []) as Variant[],
        photos: [] as File[],
        remove_image_ids: [] as number[],
    });

    const keptImages = (product?.images ?? []).filter((image) => !form.data.remove_image_ids.includes(image.id));
    const slots = keptImages.length + form.data.photos.length;

    function addPhoto(file: File) {
        form.setData('photos', [...form.data.photos, file]);
        setPreviews([...previews, URL.createObjectURL(file)]);
    }

    function removeNewPhoto(index: number) {
        form.setData('photos', form.data.photos.filter((_, position) => position !== index));
        setPreviews(previews.filter((_, position) => position !== index));
    }

    function setVariant(index: number, change: Partial<Variant>) {
        form.setData('variants', form.data.variants.map((variant, position) => (position === index ? { ...variant, ...change } : variant)));
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        if (product) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(update.url({ product: product.id }), { forceFormData: true });
        } else {
            form.post(store.url(), { forceFormData: true });
        }
    }

    const title = product ? t('products.form.editTitle') : t('products.form.newTitle');
    const errors = form.errors as Record<string, string>;

    return (
        <>
            <Head title={title} />
            <PageHeader title={title} back={product ? show.url({ product: product.id }) : index.url()} />

            <form onSubmit={submit} className="flex flex-col gap-4 px-5 pt-2 lg:bg-card lg:border-border lg:mx-5 lg:mt-2 lg:max-w-[600px] lg:rounded-2xl lg:border lg:p-7">
                <div>
                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">{t('products.form.photos')}</p>
                    <div className="grid grid-cols-4 gap-2">
                        {keptImages.map((image) => (
                            <div key={image.id} className="relative aspect-square overflow-hidden rounded-xl">
                                <img src={image.url} alt="" className="size-full object-cover" />
                                <button
                                    type="button"
                                    aria-label={t('products.form.removePhoto')}
                                    onClick={() => form.setData('remove_image_ids', [...form.data.remove_image_ids, image.id])}
                                    className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                                >
                                    <XIcon className="size-3" weight="bold" />
                                </button>
                            </div>
                        ))}
                        {form.data.photos.map((_, position) => (
                            <div key={previews[position]} className="relative aspect-square overflow-hidden rounded-xl">
                                <img src={previews[position]} alt="" className="size-full object-cover" />
                                <button
                                    type="button"
                                    aria-label={t('products.form.removePhoto')}
                                    onClick={() => removeNewPhoto(position)}
                                    className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                                >
                                    <XIcon className="size-3" weight="bold" />
                                </button>
                            </div>
                        ))}
                        {slots < MAX_PHOTOS && (
                            <label className="border-border text-muted-foreground flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-[11px] hover:border-primary/50 has-[:focus-visible]:ring-ring/50 transition-colors has-[:focus-visible]:ring-[3px]">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];

                                        if (file) {
                                            addPhoto(file);
                                            event.target.value = '';
                                        }
                                    }}
                                />
                                <CameraIcon className="size-5" />
                                {slots === 0 ? t('products.form.cover') : t('products.form.addPhoto')}
                            </label>
                        )}
                    </div>
                    <InputError message={errors.photos || errors['photos.0']} />
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name">{t('products.form.name')}</Label>
                    <Input id="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} placeholder={t('products.form.namePlaceholder')} className="h-11" />
                    <InputError message={form.errors.name} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="description">{t('products.form.description')}</Label>
                    <Textarea id="description" value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} placeholder={t('products.form.descriptionPlaceholder')} />
                    <InputError message={form.errors.description} />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="price">{t('products.form.price')}</Label>
                        <MoneyInput id="price" cents={form.data.price_cents} onCentsChange={(cents) => form.setData('price_cents', cents)} placeholder={t('products.form.pricePlaceholder')} className="h-11" />
                        <InputError message={form.errors.price_cents} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cost">{t('products.form.cost')}</Label>
                        <MoneyInput id="cost" cents={form.data.cost_cents} onCentsChange={(cents) => form.setData('cost_cents', cents)} placeholder={t('products.form.costPlaceholder')} className="h-11" />
                        <InputError message={form.errors.cost_cents} />
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="category">{t('products.form.category')}</Label>
                    <Input id="category" value={form.data.category} onChange={(event) => form.setData('category', event.target.value)} placeholder={t('products.form.categoryPlaceholder')} className="h-11" />
                    {categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {categories.map((item) => (
                                <Chip key={item} active={form.data.category === item} onClick={() => form.setData('category', item)}>
                                    {item}
                                </Chip>
                            ))}
                        </div>
                    )}
                    <InputError message={form.errors.category} />
                </div>

                <div>
                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">{t('products.form.variants')}</p>
                    <div className="flex flex-col gap-2">
                        {form.data.variants.map((variant, position) => (
                            <div key={variant.id ?? `new-${position}`} className="flex items-center gap-2">
                                <Input
                                    value={variant.name}
                                    onChange={(event) => setVariant(position, { name: event.target.value })}
                                    aria-label={t('products.form.variantName')}
                                    placeholder={t('products.form.variantName')}
                                    className="h-10 flex-1"
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    inputMode="numeric"
                                    value={variant.stock_qty}
                                    onChange={(event) => setVariant(position, { stock_qty: Number(event.target.value) })}
                                    aria-label={t('products.form.variantStock')}
                                    className="h-10 w-[70px]"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={t('products.form.removeVariant')}
                                    onClick={() => form.setData('variants', form.data.variants.filter((_, index) => index !== position))}
                                >
                                    <XIcon />
                                </Button>
                            </div>
                        ))}
                        <InputError message={errors['variants.0.name'] || errors['variants.0.stock_qty']} />
                    </div>
                    <button
                        type="button"
                        onClick={() => form.setData('variants', [...form.data.variants, { name: '', stock_qty: 0 }])}
                        className="text-brand border-border mt-2 flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed p-2.5 text-[13.5px] font-semibold"
                    >
                        <PlusIcon className="size-3.5" weight="bold" />
                        {t('products.form.addVariant')}
                    </button>
                </div>

                <div className={cn('grid gap-2.5', form.data.variants.length === 0 ? 'grid-cols-2' : 'grid-cols-1')}>
                    {form.data.variants.length === 0 && (
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="stock">{t('products.form.stock')}</Label>
                            <Input id="stock" type="number" min={0} inputMode="numeric" value={form.data.stock_qty} onChange={(event) => form.setData('stock_qty', Number(event.target.value))} className="h-11" />
                            <InputError message={form.errors.stock_qty} />
                        </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="min-stock">{t('products.form.minStock')}</Label>
                        <Input id="min-stock" type="number" min={0} inputMode="numeric" value={form.data.min_stock} onChange={(event) => form.setData('min_stock', Number(event.target.value))} placeholder="5" className="h-11" />
                        <InputError message={form.errors.min_stock} />
                    </div>
                </div>

                <label className="flex items-center gap-2.5 text-sm">
                    <Checkbox checked={form.data.catalog_visible} onCheckedChange={(checked) => form.setData('catalog_visible', checked === true)} />
                    {t('products.form.catalogVisible')}
                </label>

                <div className="flex gap-2.5">
                    <Button asChild variant="ghost" className="hidden h-11 flex-1 lg:inline-flex">
                        <Link href={product ? show.url({ product: product.id }) : index.url()}>{t('common.cancel')}</Link>
                    </Button>
                    <Button type="submit" size="lg" className="h-12 flex-1 text-base lg:h-11" disabled={form.processing}>
                        {t('products.form.save')}
                    </Button>
                </div>
            </form>
        </>
    );
}
