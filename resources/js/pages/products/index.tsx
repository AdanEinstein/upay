import { Head, Link } from '@inertiajs/react';
import {
    ListIcon,
    PackageIcon,
    PlusIcon,
    SquaresFourIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip, ChipRow } from '@/components/shop/chip';
import EmptyState from '@/components/shop/empty-state';
import MoreButton from '@/components/shop/more-button';
import ProductImage from '@/components/shop/product-image';
import ScreenTitle from '@/components/shop/screen-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormat } from '@/hooks/use-format';
import { cn } from '@/lib/utils';
import { create, show } from '@/routes/products';

type Product = {
    id: number;
    name: string;
    category: string | null;
    priceCents: number;
    stock: number;
    minStock: number;
    imageUrl: string | null;
};

const VIEW_KEY = 'upay:products-view';

function readView(): 'grid' | 'list' {
    try {
        return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
    } catch {
        return 'grid';
    }
}

export default function ProductsIndex({ products }: { products: Product[] }) {
    const { t } = useTranslation('shop');
    const { money } = useFormat();
    const [view, setViewState] = useState<'grid' | 'list'>(readView);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [onlyLow, setOnlyLow] = useState(false);

    const categories = [
        ...new Set(
            products
                .map((product) => product.category)
                .filter((item): item is string => Boolean(item)),
        ),
    ];
    const needle = query.trim().toLowerCase();
    const visible = products.filter(
        (product) =>
            product.name.toLowerCase().includes(needle) &&
            (category === null || product.category === category) &&
            (!onlyLow || product.stock <= product.minStock),
    );

    function setView(next: 'grid' | 'list') {
        setViewState(next);

        try {
            localStorage.setItem(VIEW_KEY, next);
        } catch {
            // Private mode: the toggle still works for this session.
        }
    }

    const badge = (product: Product) =>
        product.stock === 0
            ? {
                  label: t('products.badge.out'),
                  className: 'bg-destructive/15 text-destructive',
              }
            : product.stock <= product.minStock
              ? {
                    label: t('products.badge.low'),
                    className: 'bg-chart-4/20 text-chart-4',
                }
              : null;

    if (products.length === 0) {
        return (
            <>
                <Head title={t('products.title')} />
                <div className="flex justify-end px-5 pt-4 lg:hidden">
                    <MoreButton />
                </div>
                <EmptyState
                    icon={<PackageIcon />}
                    title={t('products.empty.title')}
                    description={t('products.empty.description')}
                >
                    <Button asChild size="lg" className="h-12 px-6 text-[15px]">
                        <Link href={create.url()}>
                            {t('products.empty.action')}
                        </Link>
                    </Button>
                </EmptyState>
            </>
        );
    }

    return (
        <>
            <Head title={t('products.title')} />
            <ScreenTitle
                action={
                    <div className="flex items-center gap-2">
                        <div className="bg-muted flex gap-1 rounded-[10px] p-[3px]">
                            {(
                                [
                                    ['grid', SquaresFourIcon, 'products.grid'],
                                    ['list', ListIcon, 'products.list'],
                                ] as const
                            ).map(([key, Icon, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setView(key)}
                                    aria-label={t(label)}
                                    aria-pressed={view === key}
                                    className={cn(
                                        'flex h-[26px] w-[30px] items-center justify-center rounded-[7px]',
                                        view === key
                                            ? 'bg-card text-foreground shadow-sm'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    <Icon className="size-4" />
                                </button>
                            ))}
                        </div>
                        <Button
                            asChild
                            size="icon-sm"
                            aria-label={t('products.empty.action')}
                            className="lg:h-10 lg:w-auto lg:px-4 lg:text-sm"
                        >
                            <Link href={create.url()}>
                                <PlusIcon className="lg:hidden" />
                                <span className="hidden lg:inline">
                                    {t('products.empty.action')}
                                </span>
                            </Link>
                        </Button>
                        <MoreButton />
                    </div>
                }
            >
                {t('products.title')}
            </ScreenTitle>

            <div className="flex flex-col gap-2.5 px-5 lg:flex-row lg:items-center lg:gap-2.5">
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t('products.search')}
                    className="h-10 lg:w-[280px] lg:shrink-0"
                />
                <ChipRow>
                    <Chip
                        active={category === null && !onlyLow}
                        onClick={() => {
                            setCategory(null);
                            setOnlyLow(false);
                        }}
                    >
                        {t('products.all')}
                    </Chip>
                    {categories.map((item) => (
                        <Chip
                            key={item}
                            active={category === item}
                            onClick={() =>
                                setCategory(category === item ? null : item)
                            }
                        >
                            {item}
                        </Chip>
                    ))}
                    <Chip active={onlyLow} onClick={() => setOnlyLow(!onlyLow)}>
                        {t('products.alerts')}
                    </Chip>
                </ChipRow>
            </div>

            {visible.length === 0 && (
                <p className="text-muted-foreground py-10 text-center text-sm">
                    {t('common.noResults')}
                </p>
            )}

            {view === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 px-5 pt-2 lg:grid-cols-4 lg:gap-4">
                    {visible.map((product) => {
                        const flag = badge(product);

                        return (
                            <Link
                                key={product.id}
                                href={show.url({ product: product.id })}
                                className="border-border bg-card relative overflow-hidden rounded-2xl border"
                            >
                                {flag && (
                                    <span
                                        className={cn(
                                            'absolute top-2 left-2 z-10 rounded-full px-2 py-0.5 text-[10.5px] font-bold',
                                            flag.className,
                                        )}
                                    >
                                        {flag.label}
                                    </span>
                                )}
                                <ProductImage
                                    url={product.imageUrl}
                                    className="h-[100px] w-full lg:h-[130px]"
                                />
                                <div className="px-2.5 pt-2 pb-2.5">
                                    <p className="mb-0.5 text-[12.5px] leading-tight font-semibold">
                                        {product.name}
                                    </p>
                                    <p className="text-muted-foreground text-[12.5px]">
                                        {money(product.priceCents)}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <ul className="flex flex-col gap-2 px-5 pt-2">
                    {visible.map((product) => {
                        const flag = badge(product);

                        return (
                            <li key={product.id}>
                                <Link
                                    href={show.url({ product: product.id })}
                                    className="border-border flex items-center gap-2.5 rounded-xl border p-2"
                                >
                                    <ProductImage
                                        url={product.imageUrl}
                                        className="size-11 shrink-0 rounded-lg"
                                        iconClassName="size-[18px]"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13.5px] font-semibold">
                                            {product.name}
                                        </p>
                                        <p className="text-muted-foreground mt-0.5 text-xs">
                                            {money(product.priceCents)}
                                        </p>
                                    </div>
                                    {flag && (
                                        <span
                                            className={cn(
                                                'rounded-full px-2 py-0.5 text-[10.5px] font-bold whitespace-nowrap',
                                                flag.className,
                                            )}
                                        >
                                            {flag.label}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}
