import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import Heading from '@/components/heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/money';

type Props = {
    mrrCents: number;
    mrrChangePercent: number | null;
    activeOrganizations: number;
    newOrganizations: number;
    churn: { count: number; percent: number | null };
    pastDue: number;
    series: { month: string; mrrCents: number }[];
    byPlan: { name: string; count: number; percent: number }[];
};

export default function Dashboard({
    mrrCents,
    mrrChangePercent,
    activeOrganizations,
    newOrganizations,
    churn,
    pastDue,
    series,
    byPlan,
}: Props) {
    const { t, i18n } = useTranslation('super');
    const locale = i18n.resolvedLanguage;
    const percent = (value: number, signed = false) =>
        `${new Intl.NumberFormat(locale, {
            maximumFractionDigits: 1,
            signDisplay: signed ? 'exceptZero' : 'auto',
        }).format(value)}%`;
    const peak = Math.max(...series.map((point) => point.mrrCents), 1);

    return (
        <>
            <Head title={t('dashboard.title')} />

            <div className="space-y-6">
                <Heading
                    title={t('dashboard.heading')}
                    description={t('dashboard.description')}
                />

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Card size="sm" className="col-span-2 lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-muted-foreground text-xs font-normal">
                                {t('dashboard.mrr')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <p className="text-2xl font-semibold tabular-nums">
                                {formatMoney(mrrCents, locale)}
                            </p>
                            {mrrChangePercent !== null && (
                                <p
                                    className={
                                        mrrChangePercent >= 0
                                            ? 'text-xs text-green-600 dark:text-green-400'
                                            : 'text-destructive text-xs'
                                    }
                                >
                                    {t('dashboard.mrrChange', {
                                        value: percent(mrrChangePercent, true),
                                    })}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card size="sm">
                        <CardHeader>
                            <CardTitle className="text-muted-foreground text-xs font-normal">
                                {t('dashboard.activeOrganizations')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold tabular-nums">
                            {activeOrganizations}
                        </CardContent>
                    </Card>

                    <Card size="sm">
                        <CardHeader>
                            <CardTitle className="text-muted-foreground text-xs font-normal">
                                {t('dashboard.newOrganizations')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold tabular-nums">
                            {newOrganizations}
                        </CardContent>
                    </Card>

                    <Card size="sm" className="col-span-2 lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-muted-foreground text-xs font-normal">
                                {t('dashboard.churn')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <p className="text-2xl font-semibold tabular-nums">
                                {churn.count}
                            </p>
                            <p className="text-muted-foreground text-xs">
                                {churn.percent === null
                                    ? t('dashboard.churnDetailNoBase', {
                                          pastDue,
                                      })
                                    : t('dashboard.churnDetail', {
                                          percent: percent(churn.percent),
                                          pastDue,
                                      })}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('dashboard.chart')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                role="img"
                                aria-label={t('dashboard.chartLabel')}
                                className="flex h-44 items-end gap-1.5"
                            >
                                {series.map((point) => (
                                    <div
                                        key={point.month}
                                        title={formatMoney(
                                            point.mrrCents,
                                            locale,
                                        )}
                                        className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                                    >
                                        <div
                                            className="bg-brand w-full rounded-t-md"
                                            style={{
                                                height: `${Math.max(2, (point.mrrCents / peak) * 100)}%`,
                                            }}
                                        />
                                        <span className="text-muted-foreground text-[10px]">
                                            {new Date(
                                                `${point.month}-01T00:00:00`,
                                            ).toLocaleDateString(locale, {
                                                month: 'short',
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('dashboard.byPlan')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {byPlan.length === 0 && (
                                <p className="text-muted-foreground text-sm">
                                    {t('dashboard.noPlans')}
                                </p>
                            )}
                            {byPlan.map((plan) => (
                                <div key={plan.name} className="grid gap-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span>{plan.name}</span>
                                        <span className="font-semibold tabular-nums">
                                            {plan.percent}%
                                        </span>
                                    </div>
                                    <div
                                        role="progressbar"
                                        aria-label={plan.name}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={plan.percent}
                                        className="bg-muted h-2 overflow-hidden rounded-full"
                                    >
                                        <div
                                            className="bg-brand h-full rounded-full"
                                            style={{
                                                width: `${plan.percent}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
