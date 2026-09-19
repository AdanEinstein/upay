import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRightIcon, CopyIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import AppLogoIcon from '@/components/app-logo-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDay, formatMoney } from '@/lib/money';
import { login } from '@/routes';
import { login as superAdminLogin } from '@/routes/super-admin';

// Keep in sync with Organization::RESERVED_SLUGS.
const SUPER_ADMIN_SLUG = 'super-admin';

export default function Welcome() {
    const { t, i18n } = useTranslation(['welcome', 'public']);
    const { name } = usePage().props;
    const [slug, setSlug] = useState('');
    const [invalid, setInvalid] = useState(false);
    const locale = i18n.language;

    function submit(event: FormEvent) {
        event.preventDefault();

        const organization = slug.trim().toLowerCase();

        if (!/^[a-z0-9-]+$/.test(organization)) {
            setInvalid(true);

            return;
        }

        router.visit(organization === SUPER_ADMIN_SLUG ? superAdminLogin() : login({ organization }));
    }

    // ponytail: sample data for the preview; real numbers live in public/debt.
    const preview = [
        { number: 2, amountCents: 15000, date: '2026-09-15', overdue: true },
        { number: 3, amountCents: 15000, date: '2026-10-15', overdue: false },
    ];

    return (
        <>
            <Head title={t('welcome:title')} />

            <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-4 py-6 transition-opacity duration-500 motion-reduce:transition-none starting:opacity-0 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-12">
                <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <AppLogoIcon className="size-5 fill-current" />
                        </div>
                        <span className="font-semibold">{name}</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance lg:text-5xl">{t('welcome:title')}</h1>
                        <p className="max-w-md text-base text-muted-foreground text-pretty">{t('welcome:subtitle')}</p>
                    </div>

                    <form onSubmit={submit} noValidate className="flex max-w-md flex-col gap-3">
                        <Label htmlFor="organization">{t('welcome:form.label')}</Label>
                        <Input
                            id="organization"
                            value={slug}
                            onChange={(event) => {
                                setSlug(event.target.value);
                                setInvalid(false);
                            }}
                            placeholder={t('welcome:form.placeholder')}
                            autoCapitalize="none"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            inputMode="url"
                            className="h-12 px-4 text-base"
                            aria-invalid={invalid}
                            aria-describedby={invalid ? 'organization-error' : undefined}
                        />
                        {invalid && (
                            <p id="organization-error" role="alert" className="text-sm text-destructive">
                                {t('welcome:form.error')}
                            </p>
                        )}
                        <Button type="submit" className="h-12 text-base">
                            {t('welcome:form.submit')}
                            <ArrowRightIcon />
                        </Button>
                    </form>
                </div>

                {/* Product preview: the page a customer sees. Decorative, so it is hidden from assistive tech. */}
                <div aria-hidden="true" inert className="mx-auto w-full max-w-72 lg:max-w-80">
                    <div className="flex flex-col gap-4 rounded-[2.5rem] border-[6px] border-foreground bg-background p-4 shadow-xl">
                        <div className="mx-auto h-1.5 w-16 rounded-full bg-foreground/15" />
                        <div>
                            <p className="text-xs text-muted-foreground">{t('welcome:preview.store')}</p>
                            <p className="text-lg font-semibold">{t('public:greeting', { name: 'Maria' })}</p>
                        </div>
                        <div className="rounded-2xl border p-3">
                            <p className="text-xs text-muted-foreground">{t('public:totalOpen')}</p>
                            <p className="text-2xl font-bold tabular-nums">{formatMoney(30000, locale)}</p>
                        </div>
                        <ul className="flex flex-col divide-y rounded-2xl border">
                            {preview.map((item) => (
                                <li key={item.number} className="flex items-center gap-2 p-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{t('welcome:preview.item')}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t('public:installmentOf', { number: item.number, total: 3 })} ·{' '}
                                            {t('public:dueOn', { date: formatDay(item.date, locale) })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-sm font-semibold tabular-nums">{formatMoney(item.amountCents, locale)}</span>
                                        <Badge variant={item.overdue ? 'destructive' : 'secondary'}>
                                            {item.overdue ? t('public:overdue') : t('public:pending')}
                                        </Badge>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <Button tabIndex={-1} className="h-11">
                            <CopyIcon />
                            {t('public:copyPix')}
                        </Button>
                    </div>
                </div>

                <footer className="mt-auto text-sm text-muted-foreground lg:col-span-2">
                    <Link href={superAdminLogin()} className="underline underline-offset-4 hover:text-foreground">
                        {t('welcome:platformAccess')}
                    </Link>
                </footer>
            </main>
        </>
    );
}
