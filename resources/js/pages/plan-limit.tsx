import { Head, Link } from '@inertiajs/react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import MobileScreen from '@/components/mobile-screen';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/organization-settings';

type Props = {
    plan: { name: string };
    limit: number;
    used: number;
};

export default function PlanLimit({ plan, limit, used }: Props) {
    const { t } = useTranslation('onboarding');
    const reached = used >= limit;

    return (
        <>
            <Head title={t('planLimit.title')} />

            <MobileScreen className="items-center justify-center gap-4 p-8 text-center">
                <div className="bg-destructive/10 text-destructive flex size-[72px] items-center justify-center rounded-full">
                    <WarningCircleIcon className="size-8" />
                </div>
                <h1 className="font-heading text-xl font-bold">
                    {t('planLimit.title')}
                </h1>
                <p className="text-muted-foreground max-w-xs text-sm">
                    {t('planLimit.description', { plan: plan.name, limit })}
                </p>

                <div className="grid w-full max-w-xs gap-1.5">
                    <div className="flex justify-between text-[13px] font-semibold">
                        <span>{t('planLimit.customers')}</span>
                        <span>
                            {used}/{limit}
                        </span>
                    </div>
                    <div
                        role="progressbar"
                        aria-label={t('planLimit.customers')}
                        aria-valuemin={0}
                        aria-valuemax={limit}
                        aria-valuenow={Math.min(used, limit)}
                        className="bg-muted h-2 overflow-hidden rounded-full"
                    >
                        <div
                            className={cn(
                                'h-full rounded-full',
                                reached ? 'bg-destructive' : 'bg-brand',
                            )}
                            style={{
                                width: `${Math.min(100, (used / limit) * 100)}%`,
                            }}
                        />
                    </div>
                </div>

                <div className="mt-2 flex w-full max-w-xs flex-col gap-2.5">
                    <Button asChild className="h-12 text-base">
                        <Link href={edit()}>{t('planLimit.viewPlans')}</Link>
                    </Button>
                    <Button
                        variant="ghost"
                        className="h-10"
                        onClick={() => window.history.back()}
                    >
                        {t('planLimit.close')}
                    </Button>
                </div>
            </MobileScreen>
        </>
    );
}
