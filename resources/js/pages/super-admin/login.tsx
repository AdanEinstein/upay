import { Form, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import i18n from '@/lib/i18n';
import { store } from '@/routes/super-admin/login';

export default function SuperAdminLogin() {
    const { t } = useTranslation(['super', 'common']);

    return (
        <>
            <Head title={t('super:login.title')} />

            <Form
                action={store().url}
                method="post"
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('common:email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                autoComplete="email"
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
                                autoComplete="current-password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <Button type="submit" disabled={processing}>
                            {t('common:logIn')}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

SuperAdminLogin.layout = {
    title: i18n.t('super:login.title'),
    description: i18n.t('super:login.description'),
    split: false,
};
