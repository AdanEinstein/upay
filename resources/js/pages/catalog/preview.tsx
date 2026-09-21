import { Head, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { NOTICE_STYLES } from '@/components/shop/notice-styles';
import type { NoticeType } from '@/components/shop/notice-styles';
import PageHeader from '@/components/shop/page-header';
import ProductImage from '@/components/shop/product-image';
import { Button } from '@/components/ui/button';
import { useFormat } from '@/hooks/use-format';
import { cn } from '@/lib/utils';
import { publish, show } from '@/routes/catalog';

type Props = {
    store: { name: string; accentColor: string; logoUrl: string | null; coverUrl: string | null; welcomeText: string | null };
    notice: { text: string; type: NoticeType } | null;
    promotions: { id: number; name: string; type: 'percent' | 'price'; percent: number | null; promoPriceCents: number | null; imageUrl: string | null }[];
    products: { id: number; name: string; priceCents: number; imageUrl: string | null }[];
};

export default function CatalogPreview({ store, notice, promotions, products }: Props) {
    const { t } = useTranslation('shop');
    const { money } = useFormat();

    return (
        <>
            <Head title={t('catalog.previewPage.title')} />
            <PageHeader title={t('catalog.previewPage.title')} back={show.url()} />

            {notice && <div className={cn('px-5 py-2 text-[12.5px] font-semibold', NOTICE_STYLES[notice.type])}>{notice.text}</div>}

            <div className="flex flex-col gap-4 px-5">
                <div className="mt-3 h-[90px] overflow-hidden rounded-2xl" style={{ backgroundColor: store.accentColor }}>
                    {store.coverUrl && <img src={store.coverUrl} alt="" className="size-full object-cover" />}
                </div>
                <div className="-mt-[30px] flex items-center gap-2.5 pl-3">
                    <div className="bg-card border-background text-muted-foreground flex size-14 items-center justify-center overflow-hidden rounded-xl border-[3px] text-[11px]">
                        {store.logoUrl ? <img src={store.logoUrl} alt="" className="size-full object-cover" /> : t('catalog.previewPage.logo')}
                    </div>
                    <span className="mt-6 text-[15px] font-bold">{store.name}</span>
                </div>
                {store.welcomeText && <p className="text-muted-foreground text-[13px]">{store.welcomeText}</p>}

                {promotions.length > 0 && (
                    <>
                        <p className="text-muted-foreground text-[12.5px] font-bold uppercase">{t('catalog.previewPage.promotions')}</p>
                        <div className="flex gap-2.5 overflow-x-auto">
                            {promotions.map((promotion) => (
                                <div key={promotion.id} className="border-border w-[120px] shrink-0 overflow-hidden rounded-xl border lg:w-[180px]">
                                    <ProductImage url={promotion.imageUrl} className="h-20" />
                                    <div className="p-2">
                                        <p className="truncate text-[11.5px] font-semibold">{promotion.name}</p>
                                        <span className="text-destructive text-[11px] font-bold">
                                            {promotion.type === 'percent' ? `-${promotion.percent}%` : money(promotion.promoPriceCents ?? 0)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <p className="text-muted-foreground text-[12.5px] font-bold uppercase">{t('catalog.previewPage.products')}</p>
                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3.5">
                    {products.map((product) => (
                        <div key={product.id} className="border-border overflow-hidden rounded-xl border">
                            <ProductImage url={product.imageUrl} className="h-20" />
                            <div className="p-2">
                                <p className="truncate text-[11.5px] font-semibold">{product.name}</p>
                                <span className="text-muted-foreground text-[11.5px]">{money(product.priceCents)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-background border-border sticky bottom-0 mt-6 border-t px-5 py-3 lg:static lg:border-t-0 lg:px-5">
                <Button size="lg" className="h-12 w-full text-base lg:w-auto lg:px-8" onClick={() => router.put(publish.url())}>
                    {t('catalog.previewPage.publish')}
                </Button>
            </div>
        </>
    );
}
