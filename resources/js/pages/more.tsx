import { Head, Link } from '@inertiajs/react';
import {
    CaretRightIcon,
    ChartLineUpIcon,
    CurrencyCircleDollarIcon,
    GearIcon,
    QuestionIcon,
    ReceiptIcon,
    SignOutIcon,
    StorefrontIcon,
    WalletIcon,
    HouseLineIcon,
} from '@phosphor-icons/react';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import ScreenTitle from '@/components/shop/screen-title';
import { Button } from '@/components/ui/button';
import { whatsappUrl } from '@/lib/whatsapp';
import { logout } from '@/routes';
import { show as catalog } from '@/routes/catalog';
import { index as expenses } from '@/routes/expenses';
import { index as finance } from '@/routes/finance';
import { edit as editOrganization } from '@/routes/organization-settings';
import { index as payables } from '@/routes/payables';
import { edit as editPixKey } from '@/routes/pix-key';
import { edit as editProfile } from '@/routes/profile';
import { index as receivables } from '@/routes/receivables';

type Props = {
    pixKey: string | null;
    supportWhatsapp: string | null;
    plan: { name: string; usage: { key: 'customers' | 'products' | 'sales'; used: number; limit: number | null }[] } | null;
};

type Row = { icon: ComponentType<{ className?: string }>; label: string; hint?: string; href: string };

function Group({ rows }: { rows: Row[] }) {
    return (
        <div className="border-border divide-border divide-y overflow-hidden rounded-2xl border">
            {rows.map(({ icon: Icon, label, hint, href }) => (
                <Link key={href} href={href} className="flex items-center gap-3 px-3.5 py-3">
                    <Icon className="text-muted-foreground size-[18px]" />
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm">{label}</span>
                        {hint && <span className="text-muted-foreground mt-px block truncate text-xs">{hint}</span>}
                    </span>
                    <CaretRightIcon className="text-muted-foreground size-4" />
                </Link>
            ))}
        </div>
    );
}

export default function More({ pixKey, supportWhatsapp, plan }: Props) {
    const { t } = useTranslation('shop');

    return (
        <>
            <Head title={t('more.title')} />
            <ScreenTitle>{t('more.title')}</ScreenTitle>

            <div className="flex flex-col gap-[18px] px-5">
                <Group
                    rows={[
                        { icon: HouseLineIcon, label: t('more.shop'), href: editOrganization.url() },
                        { icon: WalletIcon, label: t('more.pix'), hint: pixKey ?? t('more.pixNotSet'), href: editPixKey.url() },
                    ]}
                />

                {plan && (
                    <div className="border-border flex flex-col gap-3 rounded-2xl border p-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{t('more.plan')}</span>
                            <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-[11.5px] font-bold">{plan.name}</span>
                        </div>
                        {plan.usage.map((item) => (
                            <div key={item.key}>
                                <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                                    <span>{t(`more.usage.${item.key}`)}</span>
                                    <span>{item.limit === null ? item.used : `${item.used}/${item.limit}`}</span>
                                </div>
                                {item.limit !== null && (
                                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                                        <div className="bg-brand h-full rounded-full" style={{ width: `${Math.min(100, (item.used / item.limit) * 100)}%` }} />
                                    </div>
                                )}
                            </div>
                        ))}
                        <Button asChild variant="outline" className="h-10 text-[13.5px]">
                            <Link href={editOrganization.url()}>{t('more.viewPlans')}</Link>
                        </Button>
                    </div>
                )}

                <div>
                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">{t('more.management')}</p>
                    <Group
                        rows={[
                            { icon: ChartLineUpIcon, label: t('finance.title'), href: finance.url() },
                            { icon: ReceiptIcon, label: t('finance.links.receivables'), href: receivables.url() },
                            { icon: CurrencyCircleDollarIcon, label: t('finance.links.expenses'), href: expenses.url() },
                            { icon: WalletIcon, label: t('finance.links.payables'), href: payables.url() },
                            { icon: StorefrontIcon, label: t('catalog.title'), href: catalog.url() },
                        ]}
                    />
                </div>

                <div className="border-border divide-border divide-y overflow-hidden rounded-2xl border">
                    <Link href={editProfile.url()} className="flex items-center gap-3 px-3.5 py-3">
                        <GearIcon className="text-muted-foreground size-[18px]" />
                        <span className="flex-1 text-sm">{t('more.settings')}</span>
                        <CaretRightIcon className="text-muted-foreground size-4" />
                    </Link>
                    {supportWhatsapp && (
                        <a
                            href={whatsappUrl(supportWhatsapp, t('more.helpMessage'))}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 px-3.5 py-3"
                        >
                            <QuestionIcon className="text-muted-foreground size-[18px]" />
                            <span className="flex-1 text-sm">{t('more.help')}</span>
                            <CaretRightIcon className="text-muted-foreground size-4" />
                        </a>
                    )}
                    <Link href={logout()} method="post" as="button" className="text-destructive flex w-full items-center gap-3 px-3.5 py-3 text-left">
                        <SignOutIcon className="size-[18px]" />
                        <span className="flex-1 text-sm">{t('more.logout')}</span>
                    </Link>
                </div>
            </div>
        </>
    );
}
