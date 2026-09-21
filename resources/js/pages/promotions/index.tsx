import { Head, Link } from '@inertiajs/react';
import { PlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/shop/chip';
import PageHeader from '@/components/shop/page-header';
import { Button } from '@/components/ui/button';
import { useFormat } from '@/hooks/use-format';
import { cn } from '@/lib/utils';
import { show } from '@/routes/catalog';
import { create, edit } from '@/routes/promotions';

type Promotion = { id: number; name: string; type: 'percent' | 'price'; percent: number | null; startsOn: string | null; endsOn: string | null; productCount: number };
type Tab = 'active' | 'scheduled' | 'expired';

const TABS: Tab[] = ['active', 'scheduled', 'expired'];

export default function PromotionsIndex({ tabs }: { tabs: Record<Tab, Promotion[]> }) {
    const { t } = useTranslation('shop');
    const { shortDate } = useFormat();
    const [tab, setTab] = useState<Tab>('active');

    const period = (promotion: Promotion) => {
        if (tab === 'scheduled' && promotion.startsOn) {
            return t('promotions.from', { date: shortDate(promotion.startsOn) });
        }

        if (tab === 'expired' && promotion.endsOn) {
            return t('promotions.endedOn', { date: shortDate(promotion.endsOn) });
        }

        return promotion.endsOn ? t('promotions.until', { date: shortDate(promotion.endsOn) }) : t('promotions.noEnd');
    };

    return (
        <>
            <Head title={t('promotions.title')} />
            <PageHeader title={t('promotions.title')} back={show.url()} />

            <div className="flex gap-1.5 px-5 pb-2.5">
                {TABS.map((key) => (
                    <Chip key={key} active={tab === key} onClick={() => setTab(key)}>
                        {t(`promotions.tabs.${key}`)}
                    </Chip>
                ))}
            </div>

            <div className="flex flex-col gap-2.5 px-5">
                {tabs[tab].map((promotion) => (
                    <Link key={promotion.id} href={edit.url({ promotion: promotion.id })} className={cn('border-border flex items-center gap-2.5 rounded-2xl border p-3', tab === 'expired' && 'opacity-55')}>
                        <span className={cn('rounded-lg px-2 py-1 text-xs font-bold', tab === 'active' ? 'bg-destructive text-white' : 'bg-muted text-muted-foreground')}>
                            {promotion.type === 'percent' ? `-${promotion.percent}%` : t('promotions.priceBadge')}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-semibold">{promotion.name}</p>
                            <p className="text-muted-foreground text-xs">
                                {t('promotions.products', { count: promotion.productCount })} · {period(promotion)}
                            </p>
                        </div>
                    </Link>
                ))}
                {tabs[tab].length === 0 && <p className="text-muted-foreground py-6 text-center text-sm">{t('promotions.empty')}</p>}
                <Button asChild size="lg" className="mt-1.5 h-11 text-[14.5px]">
                    <Link href={create.url()}>
                        <PlusIcon />
                        {t('promotions.new')}
                    </Link>
                </Button>
            </div>
        </>
    );
}
