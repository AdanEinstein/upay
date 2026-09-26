import { Form, Head } from '@inertiajs/react';
import { TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import OrganizationSettingsController from '@/actions/App/Http/Controllers/OrganizationSettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PhotoInput from '@/components/photo-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    defaultColors: Record<ColorName, string>;
};

const COLOR_FIELDS = [
    { name: 'accent_color', label: 'accentColor' },
    { name: 'accent_color_hover', label: 'accentColorHover' },
    { name: 'accent_color_soft', label: 'accentColorSoft' },
    { name: 'on_primary_color', label: 'onPrimaryColor' },
] as const;

type ColorName = (typeof COLOR_FIELDS)[number]['name'];

function FileDropzone({
    id,
    name,
    currentUrl,
    alt,
    previewClassName,
}: {
    id: string;
    name: string;
    currentUrl: string | null;
    alt: string;
    previewClassName: string;
}) {
    const { t } = useTranslation('admin');
    const [preview, setPreview] = useState(currentUrl);
    const [fileName, setFileName] = useState<string | null>(null);
    const [removed, setRemoved] = useState(false);

    return (
        <div className="grid gap-2">
            <label
                htmlFor={id}
                className="border-border text-muted-foreground hover:border-primary/50 has-[:focus-visible]:ring-ring/50 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center text-sm transition-colors has-[:focus-visible]:ring-[3px]"
            >
                <PhotoInput
                    id={id}
                    name={name}
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                            setPreview(URL.createObjectURL(file));
                            setFileName(file.name);
                            setRemoved(false);
                        }
                    }}
                />
                {preview ? (
                    <img src={preview} alt={alt} className={previewClassName} />
                ) : (
                    <UploadSimpleIcon className="size-6" />
                )}
                <span>{fileName ?? t('organizationSettings.chooseImage')}</span>
            </label>
            {removed && currentUrl && (
                <input type="hidden" name={`remove_${name}`} value="1" />
            )}
            {preview && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive justify-self-start"
                    onClick={() => {
                        const input = document.getElementById(
                            id,
                        ) as HTMLInputElement;

                        input.value = '';
                        setPreview(null);
                        setFileName(null);
                        setRemoved(true);
                    }}
                >
                    <TrashIcon />
                    {t('organizationSettings.removeImage')}
                </Button>
            )}
        </div>
    );
}

export default function OrganizationSettings({
    organization,
    defaultColors,
}: Props) {
    const { t } = useTranslation(['admin', 'common']);
    const [colors, setColors] = useState<Record<ColorName, string>>({
        accent_color: organization.accentColor,
        accent_color_hover: organization.accentColorHover,
        accent_color_soft: organization.accentColorSoft,
        on_primary_color: organization.onPrimaryColor,
    });

    return (
        <>
            <Head title={t('admin:organizationSettings.title')} />

            <h1 className="sr-only">{t('admin:organizationSettings.title')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    hideTitleOnMobile
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
                                <FileDropzone
                                    key={organization.logoUrl}
                                    id="logo"
                                    name="logo"
                                    currentUrl={organization.logoUrl}
                                    alt={t('admin:organizationSettings.logo')}
                                    previewClassName="h-10 w-auto"
                                />
                                <InputError message={errors.logo} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="favicon">
                                    {t('admin:organizationSettings.favicon')}
                                </Label>
                                <FileDropzone
                                    key={organization.faviconUrl}
                                    id="favicon"
                                    name="favicon"
                                    currentUrl={organization.faviconUrl}
                                    alt={t(
                                        'admin:organizationSettings.favicon',
                                    )}
                                    previewClassName="h-6 w-6"
                                />
                                <InputError message={errors.favicon} />
                            </div>

                            <div className="grid gap-3">
                                <div className="grid grid-cols-2 gap-4">
                                    {COLOR_FIELDS.map(({ name, label }) => (
                                        <div key={name} className="grid gap-2">
                                            <Label htmlFor={name}>
                                                {t(
                                                    `admin:organizationSettings.${label}`,
                                                )}
                                            </Label>
                                            <Input
                                                id={name}
                                                name={name}
                                                type="color"
                                                value={colors[name]}
                                                onChange={(event) =>
                                                    setColors((current) => ({
                                                        ...current,
                                                        [name]: event.target
                                                            .value,
                                                    }))
                                                }
                                            />
                                            <InputError
                                                message={errors[name]}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-self-start"
                                    onClick={() => setColors(defaultColors)}
                                >
                                    {t(
                                        'admin:organizationSettings.resetColors',
                                    )}
                                </Button>
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
            title: 'admin:organizationSettings.heading',
            href: edit(),
        },
    ],
};
