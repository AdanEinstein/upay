import { Deferred, Head } from '@inertiajs/react';
import { CaretLeftIcon, PackageIcon, WhatsappLogoIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MobileScreen from '@/components/mobile-screen';
import EmptyState from '@/components/shop/empty-state';
import { NOTICE_STYLES } from '@/components/shop/notice-styles';
import type { NoticeType } from '@/components/shop/notice-styles';
import ProductImage from '@/components/shop/product-image';
import { Chip, ChipRow } from '@/components/shop/chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormat } from '@/hooks/use-format';
import { whatsappUrl } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';

type Product = {
    id: number;
    name: string;
    description: string | null;
    category: string | null;
    priceCents: number;
    promoPriceCents: number | null;
    images: string[];
    variants: { id: number; name: string; priceCents: number | null; inStock: boolean }[];
};

type Props = {
    store: { name: string; logoUrl: string | null; coverUrl: string | null; welcomeText: string | null; whatsapp: string | null };
    notice: { text: string; type: NoticeType } | null;
    products?: Product[];
};

export default function Catalog({ store, notice, products }: Props) {
    const { t } = useTranslation('public');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const selected = products?.find((product) => product.id === selectedId) ?? null;

    return (
        <>
            <Head title={t('catalogTitle', { store: store.name })} />

            {selected ? (
                <ProductScreen product={selected} whatsapp={store.whatsapp} onBack={() => setSelectedId(null)} />
            ) : (
                <MobileScreen>
                    {notice && <div className={cn('px-5 py-2 text-[12.5px] font-semibold', NOTICE_STYLES[notice.type])}>{notice.text}</div>}

                    <div className="flex flex-col gap-3.5 px-5 pt-3 pb-8">
                        <div className="bg-brand h-[100px] overflow-hidden rounded-2xl">
                            {store.coverUrl && <img src={store.coverUrl} alt="" className="size-full object-cover" />}
                        </div>
                        <div className="-mt-7 flex items-center gap-2.5 pl-2.5">
                            <div className="bg-card border-background text-muted-foreground flex size-[52px] items-center justify-center overflow-hidden rounded-xl border-[3px] text-[10px]">
                                {store.logoUrl ? <img src={store.logoUrl} alt="" className="size-full object-cover" /> : t('logo')}
                            </div>
                            <h1 className="mt-5 text-base font-bold">{store.name}</h1>
                        </div>
                        {store.welcomeText && <p className="text-muted-foreground text-[13px]">{store.welcomeText}</p>}

                        <Deferred data="products" fallback={<CatalogSkeleton />}>
                            <Listing products={products ?? []} onOpen={setSelectedId} />
                        </Deferred>
                    </div>
                </MobileScreen>
            )}
        </>
    );
}

function Listing({ products, onOpen }: { products: Product[]; onOpen: (id: number) => void }) {
    const { t } = useTranslation('public');
    const { money } = useFormat();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string | null>(null);

    if (products.length === 0) {
        return (
            <EmptyState icon={<PackageIcon />} title={t('emptyCatalogTitle')} description={t('emptyCatalogDescription')} />
        );
    }

    const categories = [...new Set(products.map((product) => product.category).filter((name): name is string => !!name))];
    const query = search.trim().toLowerCase();
    const visible = products.filter(
        (product) => (category === null || product.category === category) && product.name.toLowerCase().includes(query),
    );
    const promos = visible.filter((product) => product.promoPriceCents !== null);

    return (
        <>
            <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('searchProducts')}
                aria-label={t('searchProducts')}
                className="h-10"
            />

            {categories.length > 0 && (
                <ChipRow>
                    <Chip active={category === null} onClick={() => setCategory(null)}>{t('allCategories')}</Chip>
                    {categories.map((name) => (
                        <Chip key={name} active={category === name} onClick={() => setCategory(name)}>{name}</Chip>
                    ))}
                </ChipRow>
            )}

            {visible.length === 0 && <p className="text-muted-foreground py-6 text-center text-sm">{t('noResults')}</p>}

            {promos.length > 0 && (
                <section>
                    <h2 className="text-muted-foreground mb-2 text-[12.5px] font-bold uppercase">{t('promotions')}</h2>
                    <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                        {promos.map((product) => (
                            <ProductCard key={product.id} product={product} onOpen={onOpen} className="w-[150px] shrink-0" money={money} />
                        ))}
                    </div>
                </section>
            )}

            {visible.length > 0 && (
                <section>
                    <h2 className="text-muted-foreground mb-2 text-[12.5px] font-bold uppercase">{t('products')}</h2>
                    <div className="grid grid-cols-2 gap-2.5">
                        {visible.map((product) => (
                            <ProductCard key={product.id} product={product} onOpen={onOpen} money={money} />
                        ))}
                    </div>
                </section>
            )}
        </>
    );
}

function Price({ product, money, className }: { product: Product; money: (cents: number) => string; className?: string }) {
    return product.promoPriceCents !== null ? (
        <p className={className}>
            <span className="text-muted-foreground line-through">{money(product.priceCents)}</span>{' '}
            <span className="text-destructive font-bold">{money(product.promoPriceCents)}</span>
        </p>
    ) : (
        <p className={cn('text-muted-foreground', className)}>{money(product.priceCents)}</p>
    );
}

function ProductCard({
    product,
    onOpen,
    money,
    className,
}: {
    product: Product;
    onOpen: (id: number) => void;
    money: (cents: number) => string;
    className?: string;
}) {
    const percent = product.promoPriceCents !== null ? Math.round((1 - product.promoPriceCents / product.priceCents) * 100) : null;

    return (
        <button
            type="button"
            onClick={() => onOpen(product.id)}
            className={cn('border-border overflow-hidden rounded-xl border text-left', className)}
        >
            <div className="relative">
                <ProductImage url={product.images[0] ?? null} className="h-[100px]" />
                {percent !== null && (
                    <span className="bg-destructive absolute top-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white">
                        -{percent}%
                    </span>
                )}
            </div>
            <div className="p-2">
                <p className="truncate text-xs font-semibold">{product.name}</p>
                <Price product={product} money={money} className="mt-0.5 text-[11.5px]" />
            </div>
        </button>
    );
}

function ProductScreen({ product, whatsapp, onBack }: { product: Product; whatsapp: string | null; onBack: () => void }) {
    const { t } = useTranslation('public');
    const { money } = useFormat();
    const [variantId, setVariantId] = useState<number | null>(null);
    const variant = product.variants.find((item) => item.id === variantId) ?? null;
    const unitCents = product.promoPriceCents ?? variant?.priceCents ?? product.priceCents;
    const message = variant
        ? t('orderMessageVariant', { product: product.name, variant: variant.name, price: money(unitCents) })
        : t('orderMessage', { product: product.name, price: money(unitCents) });

    return (
        <MobileScreen>
            <div className="px-5 pt-3">
                <button
                    type="button"
                    aria-label={t('back')}
                    onClick={onBack}
                    className="bg-card flex size-8 items-center justify-center rounded-full border"
                >
                    <CaretLeftIcon className="size-4" />
                </button>
            </div>

            <div className="flex flex-col gap-3.5 px-5 pt-3 pb-24">
                <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto [scrollbar-width:none]">
                    {(product.images.length > 0 ? product.images : [null]).map((url, index) => (
                        <ProductImage key={index} url={url} className="h-[220px] w-full shrink-0 snap-center rounded-2xl" />
                    ))}
                </div>

                <div>
                    <h1 className="text-[17px] font-bold">{product.name}</h1>
                    <Price product={product} money={money} className="mt-1 text-sm" />
                </div>

                {product.variants.length > 0 && (
                    <section>
                        <h2 className="text-muted-foreground mb-2 text-[13px] font-semibold">{t('options')}</h2>
                        <div className="flex flex-wrap gap-2">
                            {product.variants.map((item) => (
                                <Chip
                                    key={item.id}
                                    active={variantId === item.id}
                                    disabled={!item.inStock}
                                    onClick={() => setVariantId(item.id)}
                                    className={cn('px-3.5 py-2', !item.inStock && 'line-through opacity-50')}
                                >
                                    {item.inStock ? item.name : `${item.name} · ${t('variantUnavailable')}`}
                                </Chip>
                            ))}
                        </div>
                    </section>
                )}

                {product.description && (
                    <p className="text-muted-foreground text-[13.5px] leading-relaxed whitespace-pre-line">{product.description}</p>
                )}
            </div>

            {whatsapp && (
                <div className="bg-background border-border fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                    <Button asChild className="h-12 w-full text-base">
                        <a href={whatsappUrl(whatsapp, message)} target="_blank" rel="noreferrer">
                            <WhatsappLogoIcon />
                            {t('orderOnWhatsapp')}
                        </a>
                    </Button>
                </div>
            )}
        </MobileScreen>
    );
}

function CatalogSkeleton() {
    return (
        <div className="flex flex-col gap-3" aria-busy="true">
            <Skeleton className="h-10 rounded-[10px]" />
            <div className="grid grid-cols-2 gap-2.5">
                <Skeleton className="h-[120px] rounded-xl" />
                <Skeleton className="h-[120px] rounded-xl" />
            </div>
        </div>
    );
}
