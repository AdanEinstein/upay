import { Form, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import OrganizationSettingsController from '@/actions/App/Http/Controllers/OrganizationSettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import i18n from '@/lib/i18n';
import { edit } from '@/routes/organization-settings';

type Props = {
    organization: {
        name: string;
        slug: string;
        logoUrl: string | null;
        faviconUrl: string | null;
        accentColor: string;
        accentColorHover: string;
        accentColorSoft: string;
        onPrimaryColor: string;
    };
};

export default function OrganizationSettings({ organization }: Props) {
    const { t } = useTranslation(['admin', 'common']);

    return (
        <>
            <Head title={t('admin:organizationSettings.title')} />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('admin:organizationSettings.heading')}
                    description={t('admin:organizationSettings.description')}
                />

                <Form
                    {...OrganizationSettingsController.update.form()}
                    options={{ preserveScroll: true }}
                    className="max-w-xl space-y-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('common:name')}</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={organization.name}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="logo">
                                    {t('admin:organizationSettings.logo')}
                                </Label>
                                {organization.logoUrl && (
                                    <img
                                        src={organization.logoUrl}
                                        alt="Current logo"
                                        className="h-10 w-auto"
                                    />
                                )}
                                <Input
                                    id="logo"
                                    name="logo"
                                    type="file"
                                    accept="image/*"
                                />
                                <InputError message={errors.logo} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="favicon">
                                    {t('admin:organizationSettings.favicon')}
                                </Label>
                                {organization.faviconUrl && (
                                    <img
                                        src={organization.faviconUrl}
                                        alt="Current favicon"
                                        className="h-6 w-6"
                                    />
                                )}
                                <Input
                                    id="favicon"
                                    name="favicon"
                                    type="file"
                                    accept="image/*"
                                />
                                <InputError message={errors.favicon} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="accent_color">
                                        {t(
                                            'admin:organizationSettings.accentColor',
                                        )}
                                    </Label>
                                    <Input
                                        id="accent_color"
                                        name="accent_color"
                                        type="color"
                                        defaultValue={organization.accentColor}
                                    />
                                    <InputError message={errors.accent_color} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="accent_color_hover">
                                        {t(
                                            'admin:organizationSettings.accentColorHover',
                                        )}
                                    </Label>
                                    <Input
                                        id="accent_color_hover"
                                        name="accent_color_hover"
                                        type="color"
                                        defaultValue={
                                            organization.accentColorHover
                                        }
                                    />
                                    <InputError
                                        message={errors.accent_color_hover}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="accent_color_soft">
                                        {t(
                                            'admin:organizationSettings.accentColorSoft',
                                        )}
                                    </Label>
                                    <Input
                                        id="accent_color_soft"
                                        name="accent_color_soft"
                                        type="color"
                                        defaultValue={
                                            organization.accentColorSoft
                                        }
                                    />
                                    <InputError
                                        message={errors.accent_color_soft}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="on_primary_color">
                                        {t(
                                            'admin:organizationSettings.onPrimaryColor',
                                        )}
                                    </Label>
                                    <Input
                                        id="on_primary_color"
                                        name="on_primary_color"
                                        type="color"
                                        defaultValue={
                                            organization.onPrimaryColor
                                        }
                                    />
                                    <InputError
                                        message={errors.on_primary_color}
                                    />
                                </div>
                            </div>

                            <Button disabled={processing}>
                                {t('common:save')}
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

OrganizationSettings.layout = {
    breadcrumbs: [
        {
            title: i18n.t('admin:organizationSettings.heading'),
            href: edit(),
        },
    ],
};
