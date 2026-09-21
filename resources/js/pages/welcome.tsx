import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRightIcon,
    ChartLineUpIcon,
    CheckIcon,
    CreditCardIcon,
    SquaresFourIcon,
    UsersIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import type { ComponentType, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import { login, register } from '@/routes';
import { login as superAdminLogin } from '@/routes/super-admin';

// Keep in sync with Organization::RESERVED_SLUGS.
const SUPER_ADMIN_SLUG = 'super-admin';

type Plan = {
    slug: string;
    name: string;
    priceCents: number;
    maxCustomers: number | null;
    maxProducts: number | null;
    maxUsers: number | null;
    featured: boolean;
};

const FEATURES = [
    { key: 'catalog', icon: SquaresFourIcon },
    { key: 'sales', icon: CreditCardIcon },
    { key: 'customers', icon: UsersIcon },
    { key: 'finance', icon: ChartLineUpIcon },
] as const satisfies readonly {
    key: string;
    icon: ComponentType<{ className?: string }>;
}[];

const STEPS = ['one', 'two', 'three'] as const;

const section = 'mx-auto w-full max-w-6xl px-5 py-12 sm:px-14 lg:py-16';
const heading = 'text-2xl font-bold tracking-tight text-balance lg:text-3xl';

export default function Welcome({ plans }: { plans: Plan[] }) {
    const { t, i18n } = useTranslation('welcome');
    const { name } = usePage().props;
    const [slug, setSlug] = useState('');
    const [invalid, setInvalid] = useState(false);
    const locale = i18n.resolvedLanguage;

    function submit(event: FormEvent) {
        event.preventDefault();

        const organization = slug.trim().toLowerCase();

        if (!/^[a-z0-9-]+$/.test(organization)) {
            setInvalid(true);

            return;
        }

        router.visit(
            organization === SUPER_ADMIN_SLUG
                ? superAdminLogin()
                : login({ organization }),
        );
    }

    function planLines(plan: Plan): string[] {
        return [
            plan.maxCustomers === null
                ? t('plans.customersUnlimited')
                : t('plans.customersUpTo', { count: plan.maxCustomers }),
            plan.maxProducts === null
                ? t('plans.productsUnlimited')
                : t('plans.productsUpTo', { count: plan.maxProducts }),
            plan.maxUsers === null
                ? t('plans.usersUnlimited')
                : t('plans.usersUpTo', { count: plan.maxUsers }),
        ];
    }

    return (
        <>
            <Head title={t('title')} />

            <header className="border-border flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 sm:px-14">
                <div className="flex items-center gap-2.5">
                    <AppLogoIcon className="text-brand size-7" />
                    <span className="text-lg font-bold">{name}</span>
                </div>
                <nav className="flex flex-wrap items-center gap-x-7 gap-y-2 text-sm font-medium">
                    <a href="#recursos" className="hidden sm:inline">
                        {t('nav.features')}
                    </a>
                    <a href="#planos" className="hidden sm:inline">
                        {t('nav.plans')}
                    </a>
                    <a href="#entrar">{t('nav.login')}</a>
                    <Button asChild className="h-10 text-sm">
                        <Link href={register()}>{t('cta.register')}</Link>
                    </Button>
                </nav>
            </header>

            <main>
                <section
                    className={cn(
                        section,
                        'flex flex-col items-center gap-14 lg:flex-row lg:py-24',
                    )}
                >
                    <div className="flex flex-1 flex-col items-start gap-5">
                        <span className="bg-brand-soft text-brand rounded-full px-3.5 py-1.5 text-[13px] font-semibold">
                            {t('badge')}
                        </span>
                        <h1 className="text-3xl leading-[1.12] font-bold tracking-tight text-balance lg:text-5xl">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-[17px] text-pretty">
                            {t('subtitle')}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Button asChild className="h-12 px-6 text-[15px]">
                                <Link href={register()}>
                                    {t('cta.register')}
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="h-12 px-6 text-[15px]"
                            >
                                <a href="#planos">{t('cta.seePlans')}</a>
                            </Button>
                        </div>
                    </div>

                    <div
                        aria-hidden="true"
                        inert
                        className="flex w-full max-w-sm flex-1 justify-center"
                    >
                        <div className="bg-card border-border flex w-full flex-col gap-4 rounded-2xl border p-5 shadow-2xl">
                            <div>
                                <p className="text-muted-foreground text-xs">
                                    {t('preview.greeting')}
                                </p>
                                <p className="mt-0.5 text-base font-bold">
                                    {t('preview.heading')}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="bg-muted rounded-xl p-2.5">
                                    <p className="text-muted-foreground mb-1 text-[11px]">
                                        {t('preview.salesToday')}
                                    </p>
                                    <p className="text-base font-bold tabular-nums">
                                        {formatMoney(48750, locale)}
                                    </p>
                                </div>
                                <div className="bg-muted rounded-xl p-2.5">
                                    <p className="text-muted-foreground mb-1 text-[11px]">
                                        {t('preview.profitMonth')}
                                    </p>
                                    <p className="text-base font-bold tabular-nums">
                                        {formatMoney(274300, locale)}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-brand-soft text-brand flex items-center justify-between rounded-xl p-3">
                                <div>
                                    <p className="text-[11.5px]">
                                        {t('preview.owedToday')}
                                    </p>
                                    <p className="text-[13.5px] font-semibold tabular-nums">
                                        {t('preview.debtor')} ·{' '}
                                        {formatMoney(18000, locale)}
                                    </p>
                                </div>
                                <span className="bg-brand text-brand-foreground rounded-full px-2.5 py-1 text-[11px] font-semibold">
                                    {t('preview.charge')}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="recursos" className={section}>
                    <h2 className={heading}>{t('features.title')}</h2>
                    <p className="text-muted-foreground mt-2 mb-8 max-w-xl">
                        {t('features.subtitle')}
                    </p>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {FEATURES.map(({ key, icon: Icon }) => (
                            <div
                                key={key}
                                className="border-border flex flex-col gap-2.5 rounded-2xl border p-5"
                            >
                                <Icon className="text-brand size-6" />
                                <h3 className="text-base font-semibold">
                                    {t(`features.${key}.title`)}
                                </h3>
                                <p className="text-muted-foreground text-[13.5px] leading-normal">
                                    {t(`features.${key}.text`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="bg-muted">
                    <section className={section}>
                        <h2 className={cn(heading, 'mb-8')}>
                            {t('steps.title')}
                        </h2>
                        <ol className="grid gap-6 sm:grid-cols-3">
                            {STEPS.map((step, index) => (
                                <li key={step} className="flex flex-col gap-2">
                                    <span className="text-brand text-3xl font-bold">
                                        {index + 1}
                                    </span>
                                    <h3 className="text-[15.5px] font-semibold">
                                        {t(`steps.${step}.title`)}
                                    </h3>
                                    <p className="text-muted-foreground text-[13.5px] leading-normal">
                                        {t(`steps.${step}.text`)}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </section>
                </div>

                {plans.length > 0 && (
                    <section id="planos" className={section}>
                        <h2 className={heading}>{t('plans.title')}</h2>
                        <p className="text-muted-foreground mt-2 mb-8">
                            {t('plans.subtitle')}
                        </p>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {plans.map((plan) => (
                                <div
                                    key={plan.slug}
                                    className={cn(
                                        'flex flex-col gap-4 rounded-2xl p-6',
                                        plan.featured
                                            ? 'border-brand bg-brand-soft border-2'
                                            : 'border-border border',
                                    )}
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-[17px] font-semibold">
                                                {plan.name}
                                            </h3>
                                            {plan.featured && (
                                                <span className="bg-brand text-brand-foreground rounded-full px-2 py-0.5 text-[10.5px] font-bold">
                                                    {t('plans.popular')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-2 text-2xl font-bold tabular-nums">
                                            {t('plans.perMonth', {
                                                price: formatMoney(
                                                    plan.priceCents,
                                                    locale,
                                                ),
                                            })}
                                        </p>
                                    </div>
                                    <ul className="flex flex-col gap-2 text-[13.5px]">
                                        {planLines(plan).map((line) => (
                                            <li
                                                key={line}
                                                className="flex items-center gap-2"
                                            >
                                                <CheckIcon
                                                    weight="bold"
                                                    className="text-brand size-4 shrink-0"
                                                />
                                                {line}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        asChild
                                        variant={
                                            plan.featured
                                                ? 'default'
                                                : 'outline'
                                        }
                                        className="mt-auto h-11"
                                    >
                                        <Link href={register()}>
                                            {t('plans.choose', {
                                                name: plan.name,
                                            })}
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section id="entrar" className={cn(section, 'max-w-xl')}>
                    <h2 className={cn(heading, 'mb-5')}>{t('login.title')}</h2>
                    <form
                        onSubmit={submit}
                        noValidate
                        className="flex flex-col gap-3"
                    >
                        <Label htmlFor="organization">
                            {t('login.form.label')}
                        </Label>
                        <Input
                            id="organization"
                            value={slug}
                            onChange={(event) => {
                                setSlug(event.target.value);
                                setInvalid(false);
                            }}
                            placeholder={t('login.form.placeholder')}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            inputMode="url"
                            className="h-12 px-4 text-base"
                            aria-invalid={invalid}
                            aria-describedby={
                                invalid ? 'organization-error' : undefined
                            }
                        />
                        {invalid && (
                            <p
                                id="organization-error"
                                role="alert"
                                className="text-destructive text-sm"
                            >
                                {t('login.form.error')}
                            </p>
                        )}
                        <Button
                            type="submit"
                            variant="outline"
                            className="h-12 text-base"
                        >
                            {t('login.form.submit')}
                            <ArrowRightIcon />
                        </Button>
                    </form>
                </section>

                <section className="bg-brand text-brand-foreground flex flex-col items-center gap-4 px-5 py-14 text-center sm:px-14">
                    <h2 className="text-2xl font-bold text-balance lg:text-3xl">
                        {t('finalCta.title')}
                    </h2>
                    <p className="max-w-md opacity-90">{t('finalCta.text')}</p>
                    <Button
                        asChild
                        className="bg-brand-foreground text-brand hover:bg-brand-foreground/90 h-12 px-7 text-[15px]"
                    >
                        <Link href={register()}>{t('cta.register')}</Link>
                    </Button>
                </section>
            </main>

            <footer className="border-border text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t px-5 py-7 text-[13px] sm:px-14">
                <span>
                    {t('footer.rights', {
                        year: new Date().getFullYear(),
                        name,
                    })}
                </span>
                <Link
                    href={superAdminLogin()}
                    className="hover:text-foreground underline underline-offset-4"
                >
                    {t('platformAccess')}
                </Link>
            </footer>
        </>
    );
}
