import { Form, Head } from '@inertiajs/react';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import i18n from '@/lib/i18n';
import { login } from '@/routes';
import { email as sendResetLink } from '@/routes/password';

type Props = { status?: string };

export default function ForgotPassword({ status }: Props) {
    const { t } = useTranslation(['auth', 'common']);
    const [email, setEmail] = useState('');

    return (
        <>
            <Head title={t('auth:forgotPassword.title')} />

            {status ? (
                <div className="flex flex-col items-center gap-4 pt-6 text-center">
                    <div className="bg-brand/10 text-brand flex size-[72px] items-center justify-center rounded-full">
                        <EnvelopeSimpleIcon className="size-8" />
                    </div>
                    <h1 className="font-heading text-xl font-bold">
                        {t('auth:forgotPassword.sent.title')}
                    </h1>
                    <p className="text-muted-foreground max-w-xs text-sm">
                        {t('auth:forgotPassword.sent.description', { email })}
                    </p>
                    <div className="mt-2 flex w-full max-w-xs flex-col gap-2.5">
                        <Form
                            {...sendResetLink.form()}
                            transform={() => ({ email })}
                        >
                            {({ processing }) => (
                                <Button
                                    variant="outline"
                                    className="h-12 w-full text-[15px]"
                                    disabled={processing}
                                >
                                    {processing && <Spinner />}
                                    {t('auth:forgotPassword.sent.resend')}
                                </Button>
                            )}
                        </Form>
                        <Button
                            variant="ghost"
                            className="h-11 text-[15px]"
                            asChild
                        >
                            <TextLink href={login()}>
                                {t('auth:forgotPassword.backToLogin')}
                            </TextLink>
                        </Button>
                    </div>
                </div>
            ) : (
                <Form {...sendResetLink.form()} className="flex flex-col gap-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    {t('common:email')}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    required
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    placeholder="email@example.com"
                                    className="h-11"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <Button
                                className="h-12 w-full text-base"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing && <Spinner />}
                                {t('auth:forgotPassword.submit')}
                            </Button>

                            <TextLink
                                href={login()}
                                className="text-muted-foreground text-center text-sm no-underline"
                            >
                                {t('auth:forgotPassword.backToLogin')}
                            </TextLink>
                        </>
                    )}
                </Form>
            )}
        </>
    );
}

// The confirmation state carries its own heading, so the layout header is dropped.
ForgotPassword.layout = ({ status }: Props) => ({
    title: status ? '' : i18n.t('auth:forgotPassword.title'),
    description: status ? '' : i18n.t('auth:forgotPassword.description'),
});
