import { Head, Link } from '@inertiajs/react';
import { BellIcon, EyeIcon, PaletteIcon, TagIcon } from '@phosphor-icons/react';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/shop/page-header';
import ShareSheet from '@/components/shop/share-sheet';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { useTenant } from '@/hooks/use-tenant';
import { dashboard } from '@/routes';
import { preview } from '@/routes/catalog';
import { edit as editIdentity } from '@/routes/catalog/identity';
import { edit as editNotice } from '@/routes/catalog/notice';
import { index as promotions } from '@/routes/promotions';

type Props = {
    url: string;
    published: boolean;
    activePromotions: number;
    noticeLive: boolean;
};

export default function CatalogShow({
    url,
    published,
    activePromotions,
    noticeLive,
}: Props) {
    const { t } = useTranslation('shop');
    const tenant = useTenant();
    const [copied, copy] = useClipboard();
    const [sharing, setSharing] = useState(false);

    const rows: {
        icon: ComponentType<{ className?: string }>;
        title: string;
        hint: string;
        href: string;
    }[] = [
        {
            icon: PaletteIcon,
            title: t('catalog.identity'),
            hint: t('catalog.identityHint'),
            href: editIdentity.url(),
        },
        {
            icon: TagIcon,
            title: t('catalog.promotions'),
            hint: t('catalog.promotionsActive', { count: activePromotions }),
            href: promotions.url(),
        },
        {
            icon: BellIcon,
            title: t('catalog.notice'),
            hint: noticeLive
                ? t('catalog.noticeActive')
                : t('catalog.noticeInactive'),
            href: editNotice.url(),
        },
        {
            icon: EyeIcon,
            title: t('catalog.preview'),
            hint: t('catalog.previewHint'),
            href: preview.url(),
        },
    ];

    return (
        <>
            <Head title={t('catalog.title')} />
            <PageHeader title={t('catalog.title')} back={dashboard.url()} />

            <div className="flex flex-col gap-[18px] px-5 pt-2">
                <div className="bg-muted flex flex-col gap-2.5 rounded-2xl p-3.5 lg:grid lg:grid-cols-[1fr_auto] lg:gap-x-4 lg:gap-y-0.5 lg:p-[18px]">
                    <p className="text-muted-foreground flex items-center justify-between text-xs">
                        {t('catalog.publicLink')}
                        {published && (
                            <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 font-semibold">
                                {t('catalog.previewPage.published')}
                            </span>
                        )}
                    </p>
                    <p className="text-sm font-semibold break-all">
                        {url.replace(/^https?:\/\//, '')}
                    </p>
                    <div className="flex gap-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-[13px]"
                            onClick={() => copy(url)}
                        >
                            {copied === url
                                ? t('catalog.copied')
                                : t('catalog.copy')}
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1 text-[13px]"
                            onClick={() => setSharing(true)}
                        >
                            {t('catalog.share')}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3.5">
                    {rows.map(({ icon: Icon, title, hint, href }) => (
                        <Link
                            key={href}
                            href={href}
                            className="border-border bg-card flex items-center gap-3 rounded-2xl border p-3.5 lg:gap-3.5 lg:p-[18px]"
                        >
                            <span className="bg-brand-soft text-brand flex size-9 shrink-0 items-center justify-center rounded-[10px] lg:size-10">
                                <Icon className="size-[17px]" />
                            </span>
                            <span className="flex-1">
                                <span className="block text-sm font-semibold">
                                    {title}
                                </span>
                                <span className="text-muted-foreground mt-px block text-xs">
                                    {hint}
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            <ShareSheet
                open={sharing}
                onOpenChange={setSharing}
                phone={null}
                templates={[
                    {
                        key: 'invite',
                        label: t('share.invite'),
                        message: t('catalog.shareMessage', {
                            store: tenant?.name,
                            link: url,
                        }),
                    },
                ]}
            />
        </>
    );
}
