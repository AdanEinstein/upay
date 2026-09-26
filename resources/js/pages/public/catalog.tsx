import { Deferred, Head } from '@inertiajs/react';
import {
    CaretLeftIcon,
    MinusIcon,
    PackageIcon,
    PlusIcon,
    ShoppingCartIcon,
    TrashIcon,
    WhatsappLogoIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import MobileScreen from '@/components/mobile-screen';
import BottomSheet from '@/components/shop/bottom-sheet';
import EmptyState from '@/components/shop/empty-state';
import { NOTICE_STYLES } from '@/components/shop/notice-styles';
import type { NoticeType } from '@/components/shop/notice-styles';
import ProductImage from '@/components/shop/product-image';
import { Chip, ChipRow } from '@/components/shop/chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MAX_CART_QUANTITY, useCatalogCart } from '@/hooks/use-catalog-cart';
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
    variants: {
        id: number;
        name: string;
        priceCents: number | null;
        inStock: boolean;
    }[];
};

type Variant = Product['variants'][number];

type CartLine = {
    product: Product;
    variant: Variant | null;
    quantity: number;
    unitCents: number;
};

type Props = {
    store: {
        slug: string;
        name: string;
        logoUrl: string | null;
        coverUrl: string | null;
        welcomeText: string | null;
        whatsapp: string | null;
    };
    notice: { text: string; type: NoticeType } | null;
    products?: Product[];
};

// A promotion wins over a variant's own price, which wins over the base price.
function unitPrice(product: Product, variant: Variant | null): number {
    return product.promoPriceCents ?? variant?.priceCents ?? product.priceCents;
}

export default function Catalog({ store, notice, products }: Props) {
    const { t } = useTranslation('public');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const cart = useCatalogCart(store.slug);
    const selected =
        products?.find((product) => product.id === selectedId) ?? null;

    // Items saved in an earlier visit may point at products the store has
    // since hidden or deleted; those are left out instead of shown stale.
    const lines: CartLine[] = cart.items.flatMap((item) => {
        const product = products?.find(({ id }) => id === item.productId);
        const variant =
            product?.variants.find(({ id }) => id === item.variantId) ?? null;

        if (!product || (item.variantId !== null && !variant)) {
            return [];
        }

        return [
            {
                product,
                variant,
                quantity: item.quantity,
                unitCents: unitPrice(product, variant),
            },
        ];
    });
    const hasCart = store.whatsapp !== null && lines.length > 0;

    return (
        <>
            <Head title={t('catalogTitle', { store: store.name })} />

            {selected ? (
                <ProductScreen
                    product={selected}
                    whatsapp={store.whatsapp}
                    onBack={() => setSelectedId(null)}
                    onAdd={(variantId, quantity) => {
                        cart.add(selected.id, variantId, quantity);
                        toast.success(t('addedToCart'));
                        setSelectedId(null);
                    }}
                />
            ) : (
                <MobileScreen className="lg:max-w-none">
                    {notice && (
                        <div
                            className={cn(
                                'px-5 py-2 text-[12.5px] font-semibold lg:px-6',
                                NOTICE_STYLES[notice.type],
                            )}
                        >
                            {notice.text}
                        </div>
                    )}

                    <div
                        className={cn(
                            'flex flex-col gap-3.5 px-5 pt-3 lg:px-0 lg:pt-0',
                            hasCart ? 'pb-28' : 'pb-8',
                        )}
                    >
                        <div className="bg-brand h-[100px] overflow-hidden rounded-2xl lg:h-[120px] lg:rounded-none">
                            {store.coverUrl && (
                                <img
                                    src={store.coverUrl}
                                    alt=""
                                    className="size-full object-cover"
                                />
                            )}
                        </div>
                        <div className="-mt-7 flex items-center gap-2.5 pl-2.5 lg:-mt-8 lg:gap-3 lg:pl-8">
                            <div className="bg-card border-background text-muted-foreground flex size-[52px] items-center justify-center overflow-hidden rounded-xl border-[3px] text-[10px] lg:size-16">
                                {store.logoUrl ? (
                                    <img
                                        src={store.logoUrl}
                                        alt=""
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    t('logo')
                                )}
                            </div>
                            <h1 className="mt-5 text-base font-bold">
                                {store.name}
                            </h1>
                        </div>
                        <div className="flex flex-col gap-3.5 lg:mx-auto lg:w-full lg:max-w-[900px] lg:gap-5 lg:px-8 lg:pt-3">
                            {store.welcomeText && (
                                <p className="text-muted-foreground text-[13px]">
                                    {store.welcomeText}
                                </p>
                            )}

                            <Deferred
                                data="products"
                                fallback={<CatalogSkeleton />}
                            >
                                <Listing
                                    products={products ?? []}
                                    onOpen={setSelectedId}
                                />
                            </Deferred>
                        </div>
                    </div>

                    {hasCart && (
                        <CartBar
                            lines={lines}
                            onOpen={() => setCartOpen(true)}
                        />
                    )}
                </MobileScreen>
            )}

            {store.whatsapp && (
                <CartSheet
                    open={cartOpen}
                    onOpenChange={setCartOpen}
                    lines={lines}
                    whatsapp={store.whatsapp}
                    onQuantityChange={(line, quantity) => {
                        cart.setQuantity(
                            line.product.id,
                            line.variant?.id ?? null,
                            quantity,
                        );

                        if (quantity === 0 && lines.length === 1) {
                            setCartOpen(false);
                        }
                    }}
                    onClear={() => {
                        cart.clear();
                        setCartOpen(false);
                    }}
                />
            )}
        </>
    );
}

function Listing({
    products,
    onOpen,
}: {
    products: Product[];
    onOpen: (id: number) => void;
}) {
    const { t } = useTranslation('public');
    const { money } = useFormat();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string | null>(null);

    if (products.length === 0) {
        return (
            <EmptyState
                icon={<PackageIcon />}
                title={t('emptyCatalogTitle')}
                description={t('emptyCatalogDescription')}
            />
        );
    }

    const categories = [
        ...new Set(
            products
                .map((product) => product.category)
                .filter((name): name is string => !!name),
        ),
    ];
    const query = search.trim().toLowerCase();
    const visible = products.filter(
        (product) =>
            (category === null || product.category === category) &&
            product.name.toLowerCase().includes(query),
    );
    const promos = visible.filter(
        (product) => product.promoPriceCents !== null,
    );

    return (
        <>
            <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('searchProducts')}
                aria-label={t('searchProducts')}
                className="h-10 lg:h-[42px] lg:w-[360px]"
            />

            {categories.length > 0 && (
                <ChipRow>
                    <Chip
                        active={category === null}
                        onClick={() => setCategory(null)}
                    >
                        {t('allCategories')}
                    </Chip>
                    {categories.map((name) => (
                        <Chip
                            key={name}
                            active={category === name}
                            onClick={() => setCategory(name)}
                        >
                            {name}
                        </Chip>
                    ))}
                </ChipRow>
            )}

            {visible.length === 0 && (
                <p className="text-muted-foreground py-6 text-center text-sm">
                    {t('noResults')}
                </p>
            )}

            {promos.length > 0 && (
                <section>
                    <h2 className="text-muted-foreground mb-2 text-[12.5px] font-bold uppercase">
                        {t('promotions')}
                    </h2>
                    <div className="flex [scrollbar-width:none] gap-2.5 overflow-x-auto pb-1 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible">
                        {promos.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onOpen={onOpen}
                                className="w-[150px] shrink-0 lg:w-auto"
                                money={money}
                            />
                        ))}
                    </div>
                </section>
            )}

            {visible.length > 0 && (
                <section>
                    <h2 className="text-muted-foreground mb-2 text-[12.5px] font-bold uppercase">
                        {t('products')}
                    </h2>
                    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5 lg:gap-4">
                        {visible.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onOpen={onOpen}
                                money={money}
                            />
                        ))}
                    </div>
                </section>
            )}
        </>
    );
}

function Price({
    product,
    money,
    className,
}: {
    product: Product;
    money: (cents: number) => string;
    className?: string;
}) {
    return product.promoPriceCents !== null ? (
        <p className={className}>
            <span className="text-muted-foreground line-through">
                {money(product.priceCents)}
            </span>{' '}
            <span className="text-destructive font-bold">
                {money(product.promoPriceCents)}
            </span>
        </p>
    ) : (
        <p className={cn('text-muted-foreground', className)}>
            {money(product.priceCents)}
        </p>
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
    const percent =
        product.promoPriceCents !== null
            ? Math.round(
                  (1 - product.promoPriceCents / product.priceCents) * 100,
              )
            : null;

    return (
        <button
            type="button"
            onClick={() => onOpen(product.id)}
            className={cn(
                'border-border overflow-hidden rounded-xl border text-left',
                className,
            )}
        >
            <div className="relative">
                <ProductImage
                    url={product.images[0] ?? null}
                    className="h-[100px] lg:h-[130px]"
                />
                {percent !== null && (
                    <span className="bg-destructive absolute top-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white">
                        -{percent}%
                    </span>
                )}
            </div>
            <div className="p-2 lg:p-2.5">
                <p className="truncate text-xs font-semibold">{product.name}</p>
                <Price
                    product={product}
                    money={money}
                    className="mt-0.5 text-[11.5px]"
                />
            </div>
        </button>
    );
}

function ProductScreen({
    product,
    whatsapp,
    onBack,
    onAdd,
}: {
    product: Product;
    whatsapp: string | null;
    onBack: () => void;
    onAdd: (variantId: number | null, quantity: number) => void;
}) {
    const { t } = useTranslation('public');
    const { money } = useFormat();
    const [variantId, setVariantId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState(1);
    const variant =
        product.variants.find((item) => item.id === variantId) ?? null;
    const unitCents = unitPrice(product, variant);
    const message = variant
        ? t('orderMessageVariant', {
              product: product.name,
              variant: variant.name,
              price: money(unitCents),
          })
        : t('orderMessage', { product: product.name, price: money(unitCents) });
    const soldOut =
        product.variants.length > 0 &&
        product.variants.every((item) => !item.inStock);
    const needsVariant = product.variants.length > 0 && variant === null;

    return (
        <MobileScreen className="lg:max-w-none lg:justify-center">
            <div className="lg:mx-auto lg:w-[820px]">
                <div className="px-5 pt-3 lg:px-0">
                    <button
                        type="button"
                        aria-label={t('back')}
                        onClick={onBack}
                        className="bg-card flex size-8 items-center justify-center rounded-full border"
                    >
                        <CaretLeftIcon className="size-4" />
                    </button>
                </div>

                <div
                    className={cn(
                        'flex flex-col gap-3.5 px-5 pt-3 lg:grid lg:grid-cols-[400px_1fr] lg:content-start lg:gap-x-10 lg:gap-y-4 lg:px-0 lg:pb-8',
                        whatsapp ? 'pb-40' : 'pb-8',
                    )}
                >
                    <div className="flex snap-x snap-mandatory [scrollbar-width:none] gap-2 overflow-x-auto lg:row-span-4">
                        {(product.images.length > 0
                            ? product.images
                            : [null]
                        ).map((url, index) => (
                            <ProductImage
                                key={index}
                                url={url}
                                className="h-[220px] w-full shrink-0 snap-center rounded-2xl lg:h-[400px]"
                            />
                        ))}
                    </div>

                    <div>
                        <h1 className="text-[17px] font-bold lg:text-[22px]">
                            {product.name}
                        </h1>
                        <Price
                            product={product}
                            money={money}
                            className="mt-1 text-sm lg:mt-1.5 lg:text-lg"
                        />
                    </div>

                    {product.variants.length > 0 && (
                        <section>
                            <h2 className="text-muted-foreground mb-2 text-[13px] font-semibold">
                                {t('options')}
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {product.variants.map((item) => (
                                    <Chip
                                        key={item.id}
                                        active={variantId === item.id}
                                        disabled={!item.inStock}
                                        onClick={() => setVariantId(item.id)}
                                        className={cn(
                                            'px-3.5 py-2',
                                            !item.inStock &&
                                                'line-through opacity-50',
                                        )}
                                    >
                                        {item.inStock
                                            ? item.name
                                            : `${item.name} · ${t('variantUnavailable')}`}
                                    </Chip>
                                ))}
                            </div>
                        </section>
                    )}

                    {product.description && (
                        <p className="text-muted-foreground text-[13.5px] leading-relaxed whitespace-pre-line">
                            {product.description}
                        </p>
                    )}

                    {whatsapp && (
                        <div className="bg-background border-border keyboard-open:hidden fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-md flex-col gap-1 border-t px-5 pt-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:static lg:mx-0 lg:w-auto lg:max-w-[420px] lg:border-0 lg:bg-transparent lg:p-0">
                            <div className="flex gap-2.5">
                                <QuantityStepper
                                    value={quantity}
                                    min={1}
                                    onChange={setQuantity}
                                    className="h-12"
                                />
                                <Button
                                    className="h-12 flex-1 text-base"
                                    disabled={soldOut || needsVariant}
                                    onClick={() =>
                                        onAdd(variant?.id ?? null, quantity)
                                    }
                                >
                                    <ShoppingCartIcon />
                                    {soldOut
                                        ? t('soldOut')
                                        : needsVariant
                                          ? t('chooseOption')
                                          : t('addToCart')}
                                </Button>
                            </div>
                            <Button asChild variant="ghost" className="h-10">
                                <a
                                    href={whatsappUrl(whatsapp, message)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <WhatsappLogoIcon />
                                    {t('askOnWhatsapp')}
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </MobileScreen>
    );
}

function QuantityStepper({
    value,
    min,
    onChange,
    className,
}: {
    value: number;
    min: number;
    onChange: (quantity: number) => void;
    className?: string;
}) {
    const { t } = useTranslation('public');
    const removes = min === 0 && value === 1;

    return (
        <div
            className={cn(
                'border-border flex items-center rounded-md border',
                className,
            )}
        >
            <button
                type="button"
                aria-label={removes ? t('removeFromCart') : t('decrease')}
                disabled={value <= min}
                onClick={() => onChange(value - 1)}
                className="flex aspect-square h-full items-center justify-center disabled:opacity-40"
            >
                {removes ? (
                    <TrashIcon className="size-4" />
                ) : (
                    <MinusIcon className="size-4" />
                )}
            </button>
            <span
                aria-live="polite"
                className="min-w-6 text-center text-sm font-semibold tabular-nums"
            >
                {value}
            </span>
            <button
                type="button"
                aria-label={t('increase')}
                disabled={value >= MAX_CART_QUANTITY}
                onClick={() => onChange(value + 1)}
                className="flex aspect-square h-full items-center justify-center disabled:opacity-40"
            >
                <PlusIcon className="size-4" />
            </button>
        </div>
    );
}

function CartBar({ lines, onOpen }: { lines: CartLine[]; onOpen: () => void }) {
    const { t } = useTranslation('public');
    const { money } = useFormat();
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const total = lines.reduce(
        (sum, line) => sum + line.unitCents * line.quantity,
        0,
    );

    return (
        <div className="keyboard-open:hidden fixed inset-x-0 bottom-0 mx-auto w-full max-w-md px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:bottom-6 lg:p-0">
            <Button
                onClick={onOpen}
                className="h-12 w-full justify-between px-4 text-base shadow-lg"
            >
                <span className="flex items-center gap-2">
                    <ShoppingCartIcon />
                    {t('viewCart')}
                    <span className="bg-primary-foreground text-primary rounded-full px-2 text-xs font-bold">
                        {count}
                    </span>
                </span>
                <span className="font-bold">{money(total)}</span>
            </Button>
        </div>
    );
}

function CartSheet({
    open,
    onOpenChange,
    lines,
    whatsapp,
    onQuantityChange,
    onClear,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lines: CartLine[];
    whatsapp: string;
    onQuantityChange: (line: CartLine, quantity: number) => void;
    onClear: () => void;
}) {
    const { t } = useTranslation('public');
    const { money } = useFormat();
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const total = lines.reduce(
        (sum, line) => sum + line.unitCents * line.quantity,
        0,
    );
    const message = [
        t('cartMessageIntro'),
        '',
        ...lines.map((line) =>
            t('cartMessageLine', {
                count: line.quantity,
                product: line.variant
                    ? t('productWithVariant', {
                          product: line.product.name,
                          variant: line.variant.name,
                      })
                    : line.product.name,
                price: money(line.unitCents),
                subtotal: money(line.unitCents * line.quantity),
            }),
        ),
        '',
        t('cartMessageTotal', { total: money(total) }),
    ].join('\n');

    return (
        <BottomSheet
            open={open}
            onOpenChange={onOpenChange}
            title={t('cartTitle')}
            description={t('cartCount', { count })}
        >
            <ul className="divide-border flex flex-col divide-y">
                {lines.map((line) => (
                    <li
                        key={`${line.product.id}-${line.variant?.id ?? ''}`}
                        className="flex items-center gap-3 py-3 first:pt-0"
                    >
                        <ProductImage
                            url={line.product.images[0] ?? null}
                            className="size-14 shrink-0 rounded-lg"
                            iconClassName="size-5"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                                {line.product.name}
                            </p>
                            {line.variant && (
                                <p className="text-muted-foreground truncate text-xs">
                                    {line.variant.name}
                                </p>
                            )}
                            <p className="mt-0.5 text-[13px] font-bold">
                                {money(line.unitCents * line.quantity)}
                            </p>
                        </div>
                        <QuantityStepper
                            value={line.quantity}
                            min={0}
                            onChange={(quantity) =>
                                onQuantityChange(line, quantity)
                            }
                            className="h-9 shrink-0"
                        />
                    </li>
                ))}
            </ul>

            <div className="border-border flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground text-sm font-semibold">
                    {t('total')}
                </span>
                <span className="text-lg font-bold">{money(total)}</span>
            </div>

            <Button asChild className="h-12 w-full text-base">
                <a
                    href={whatsappUrl(whatsapp, message)}
                    target="_blank"
                    rel="noreferrer"
                >
                    <WhatsappLogoIcon />
                    {t('sendOrderOnWhatsapp')}
                </a>
            </Button>
            <Button variant="ghost" onClick={onClear}>
                {t('clearCart')}
            </Button>
        </BottomSheet>
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
