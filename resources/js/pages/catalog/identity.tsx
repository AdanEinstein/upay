import { Head, useForm } from '@inertiajs/react';
import { CameraIcon, CheckIcon } from '@phosphor-icons/react';
import { useMemo } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import PhotoInput from '@/components/photo-input';
import PageHeader from '@/components/shop/page-header';
import Textarea from '@/components/shop/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { maskPhone } from '@/lib/mask';
import { cn } from '@/lib/utils';
import { formatPhone } from '@/lib/whatsapp';
import { show } from '@/routes/catalog';
import { update } from '@/routes/catalog/identity';

type Props = {
    name: string;
    slug: string;
    link: string;
    logoUrl: string | null;
    coverUrl: string | null;
    welcomeText: string;
    whatsapp: string;
    accentColor: string;
    palette: string[];
};

// ponytail: blob URLs are not revoked, one small leak per picked file until reload
function usePreview(file: File | null, url: string | null) {
    const objectUrl = useMemo(
        () => (file ? URL.createObjectURL(file) : null),
        [file],
    );

    return objectUrl ?? url;
}

function ImagePicker({
    label,
    preview,
    onPick,
    className,
}: {
    label: string;
    preview: string | null;
    onPick: (file: File) => void;
    className?: string;
}) {
    return (
        <div>
            <p className="text-muted-foreground mb-1.5 text-[12.5px] font-semibold">
                {label}
            </p>
            <label
                className={cn(
                    'border-border text-muted-foreground hover:border-primary/50 has-[:focus-visible]:ring-ring/50 flex h-20 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors has-[:focus-visible]:ring-[3px]',
                    className,
                )}
            >
                <PhotoInput
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                            onPick(file);
                        }
                    }}
                />
                {preview ? (
                    <img
                        src={preview}
                        alt=""
                        className="size-full object-cover"
                    />
                ) : (
                    <CameraIcon className="size-6" />
                )}
            </label>
        </div>
    );
}

export default function CatalogIdentity({
    name,
    link,
    logoUrl,
    coverUrl,
    welcomeText,
    whatsapp,
    accentColor,
    palette,
}: Props) {
    const { t } = useTranslation('shop');
    const form = useForm({
        name,
        logo: null as File | null,
        cover: null as File | null,
        welcome_text: welcomeText,
        whatsapp: whatsapp ? formatPhone(whatsapp) : '',
        accent_color: palette.includes(accentColor) ? accentColor : palette[0],
    });

    const logoPreview = usePreview(form.data.logo, logoUrl);
    const coverPreview = usePreview(form.data.cover, coverUrl);

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(update.url(), { forceFormData: true });
    }

    return (
        <>
            <Head title={t('catalog.identityForm.title')} />
            <PageHeader
                title={t('catalog.identityForm.title')}
                back={show.url()}
            />

            <form
                onSubmit={submit}
                className="flex flex-col gap-4 px-5 pt-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8"
            >
                <div className="contents lg:flex lg:flex-col lg:gap-4">
                    <div className="border-border overflow-hidden rounded-2xl border">
                        <div
                            className="h-14"
                            style={{ backgroundColor: form.data.accent_color }}
                        />
                        <div className="bg-card flex items-center gap-2 px-3 py-2.5">
                            {logoPreview ? (
                                <img
                                    src={logoPreview}
                                    alt=""
                                    className="size-7 rounded-lg object-cover"
                                />
                            ) : (
                                <span
                                    className="size-7 rounded-lg"
                                    style={{
                                        backgroundColor: form.data.accent_color,
                                    }}
                                />
                            )}
                            <span className="text-[13px] font-semibold">
                                {form.data.name}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <ImagePicker
                            label={t('catalog.identityForm.logo')}
                            preview={logoPreview}
                            onPick={(file) => form.setData('logo', file)}
                        />
                        <ImagePicker
                            label={t('catalog.identityForm.cover')}
                            preview={coverPreview}
                            onPick={(file) => form.setData('cover', file)}
                        />
                    </div>
                    <InputError
                        message={form.errors.logo || form.errors.cover}
                    />

                    <div className="order-1 lg:order-none">
                        <p className="text-muted-foreground mb-2 text-[13px] font-semibold">
                            {t('catalog.identityForm.accent')}
                        </p>
                        <div className="flex gap-2.5">
                            {palette.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() =>
                                        form.setData('accent_color', color)
                                    }
                                    aria-label={t(
                                        'catalog.identityForm.accentOption',
                                        { color },
                                    )}
                                    aria-pressed={
                                        form.data.accent_color === color
                                    }
                                    className={cn(
                                        'flex size-[34px] items-center justify-center rounded-full',
                                        form.data.accent_color === color
                                            ? 'border-foreground border-[3px]'
                                            : 'border-border border',
                                    )}
                                    style={{ backgroundColor: color }}
                                >
                                    {form.data.accent_color === color && (
                                        <CheckIcon
                                            className="size-[15px] text-white"
                                            weight="bold"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                        <InputError message={form.errors.accent_color} />
                    </div>
                </div>

                <div className="contents lg:flex lg:flex-col lg:gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="name">
                            {t('catalog.identityForm.name')}
                        </Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            className="h-11"
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="welcome">
                            {t('catalog.identityForm.welcome')}
                        </Label>
                        <Textarea
                            id="welcome"
                            value={form.data.welcome_text}
                            onChange={(event) =>
                                form.setData('welcome_text', event.target.value)
                            }
                            className="min-h-14"
                        />
                        <InputError message={form.errors.welcome_text} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="whatsapp">
                            {t('catalog.identityForm.whatsapp')}
                        </Label>
                        <Input
                            id="whatsapp"
                            type="tel"
                            inputMode="tel"
                            value={form.data.whatsapp}
                            onChange={(event) =>
                                form.setData(
                                    'whatsapp',
                                    maskPhone(event.target.value),
                                )
                            }
                            className="h-11"
                        />
                        <InputError message={form.errors.whatsapp} />
                    </div>
                    <div className="order-2 flex flex-col gap-1.5">
                        <Label>{t('catalog.identityForm.link')}</Label>
                        <p className="border-input flex h-11 items-center rounded-full border px-3 text-[13.5px]">
                            {link}
                        </p>
                    </div>
                    <Button
                        type="submit"
                        size="lg"
                        className="order-2 h-12 text-base lg:self-start lg:px-7"
                        disabled={form.processing}
                    >
                        {t('catalog.identityForm.save')}
                    </Button>
                </div>
            </form>
        </>
    );
}
