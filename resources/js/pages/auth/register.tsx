import { Form, Head } from '@inertiajs/react';
import { CheckIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import i18n from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import { home } from '@/routes';
import { store } from '@/routes/register';

type Plan = {
    slug: string;
    name: string;
    priceCents: number;
    maxCustomers: number | null;
    featured: boolean;
};

export default function Register({ plans }: { plans: Plan[] }) {
    const { t, i18n: i18nInstance } = useTranslation(['auth', 'common']);
    const defaultPlan = (plans.find((plan) => plan.featured) ?? plans[0])?.slug;

    return (
        <>
            <Head title={t('auth:register.title')} />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    {t('auth:register.name')}
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    autoFocus
                                    autoComplete="name"
                                    placeholder={t(
                                        'auth:register.namePlaceholder',
                                    )}
                                    className="h-11"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    {t('common:email')}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    className="h-11"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    {t('common:password')}
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    autoComplete="new-password"
                                    placeholder={t(
                                        'auth:register.passwordPlaceholder',
                                    )}
                                    className="h-11"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="store_name">
                                    {t('auth:register.storeName')}
                                </Label>
                                <Input
                                    id="store_name"
                                    name="store_name"
                                    required
                                    placeholder={t(
                                        'auth:register.storePlaceholder',
                                    )}
                                    className="h-11"
                                />
                                <InputError message={errors.store_name} />
                            </div>
                        </div>

                        <fieldset className="grid gap-2.5">
                            <legend className="mb-2.5 text-sm font-semibold">
                                {t('auth:register.choosePlan')}
                            </legend>
                            {plans.map((plan) => (
                                <label
                                    key={plan.slug}
                                    className="group has-checked:border-brand has-checked:bg-brand/10 has-focus-visible:ring-ring/50 grid cursor-pointer gap-1 rounded-2xl border-2 px-4 py-3.5 has-focus-visible:ring-[3px]"
                                >
                                    <input
                                        type="radio"
                                        name="plan"
                                        value={plan.slug}
                                        defaultChecked={
                                            plan.slug === defaultPlan
                                        }
                                        className="sr-only"
                                    />
                                    <span className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-sm font-semibold">
                                            {plan.name}
                                            {plan.featured && (
                                                <Badge>
                                                    {t('auth:register.popular')}
                                                </Badge>
                                            )}
                                        </span>
                                        <CheckIcon
                                            weight="bold"
                                            className="text-brand hidden size-4 group-has-checked:block"
                                        />
                                    </span>
                                    <span className="text-muted-foreground text-[13px]">
                                        {t('auth:register.perMonth', {
                                            price: formatMoney(
                                                plan.priceCents,
                                                i18nInstance.resolvedLanguage,
                                            ),
                                        })}
                                        {' · '}
                                        {plan.maxCustomers === null
                                            ? t(
                                                  'auth:register.customersUnlimited',
                                              )
                                            : t('auth:register.customersUpTo', {
                                                  count: plan.maxCustomers,
                                              })}
                                    </span>
                                </label>
                            ))}
                            <InputError message={errors.plan} />
                        </fieldset>

                        <Button
                            type="submit"
                            className="h-12 w-full text-base"
                            disabled={processing}
                            data-test="register-button"
                        >
                            {processing && <Spinner />}
                            {t('auth:register.submit')}
                        </Button>
                    </>
                )}
            </Form>

            <p className="text-muted-foreground text-center text-[13px]">
                {t('auth:register.haveAccount')}{' '}
                <TextLink
                    href={home()}
                    className="text-brand font-semibold no-underline"
                >
                    {t('auth:register.logIn')}
                </TextLink>
            </p>
        </>
    );
}

Register.layout = {
    title: i18n.t('auth:register.title'),
    description: i18n.t('auth:register.description'),
};
