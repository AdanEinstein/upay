import { Head, useForm } from '@inertiajs/react';
import { CameraIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import MobileScreen from '@/components/mobile-screen';
import MoneyInput from '@/components/money-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { maskPixKey, pixKeyInputMode } from '@/lib/pix';
import { cn } from '@/lib/utils';
import { store } from '@/routes/onboarding';

type Step = 1 | 2 | 3;

const STEPS: Step[] = [1, 2, 3];
const PIX_TYPES = ['email', 'phone', 'cpf', 'random'] as const;
const FIELD_STEP: Record<string, Step> = {
    name: 1,
    logo: 1,
    product_name: 2,
    product_price_cents: 2,
    product_photo: 2,
};

function PhotoPicker({
    label,
    round,
    onPick,
}: {
    label: string;
    round?: boolean;
    onPick: (file: File) => void;
}) {
    const [preview, setPreview] = useState<string | null>(null);

    return (
        <label className="group flex cursor-pointer flex-col items-center gap-2 self-center">
            <input
                type="file"
                accept="image/*"
                className="peer sr-only"
                onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                        setPreview(URL.createObjectURL(file));
                        onPick(file);
                    }
                }}
            />
            <span
                className={cn(
                    'border-border text-muted-foreground peer-focus-visible:ring-ring/50 group-hover:border-primary/50 flex transition-colors items-center justify-center overflow-hidden border-2 border-dashed peer-focus-visible:ring-[3px]',
                    round ? 'size-22 rounded-full' : 'size-24 rounded-2xl',
                )}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt=""
                        className="size-full object-cover"
                    />
                ) : (
                    <CameraIcon className="size-7" />
                )}
            </span>
            <span className="text-muted-foreground text-[13px]">{label}</span>
        </label>
    );
}

export default function Onboarding({
    organization,
}: {
    organization: { name: string };
}) {
    const { t } = useTranslation('onboarding');
    const [step, setStep] = useState<Step>(1);
    const form = useForm({
        name: organization.name,
        logo: null as File | null,
        product_name: '',
        product_price_cents: null as number | null,
        product_photo: null as File | null,
        pix_key_type: 'email' as (typeof PIX_TYPES)[number],
        pix_key: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        if (step < 3) {
            setStep((step + 1) as Step);

            return;
        }

        form.post(store.url(), {
            forceFormData: true,
            onError: (errors) =>
                setStep(
                    Math.min(
                        ...Object.keys(errors).map(
                            (key) => FIELD_STEP[key] ?? 3,
                        ),
                    ) as Step,
                ),
        });
    }

    function skip() {
        if (step === 1) {
            form.setData((data) => ({
                ...data,
                name: organization.name,
                logo: null,
            }));
        } else {
            form.setData((data) => ({
                ...data,
                product_name: '',
                product_price_cents: null,
                product_photo: null,
            }));
        }

        setStep((step + 1) as Step);
    }

    const { errors } = form;

    return (
        <>
            <Head title={t('onboarding.title')} />

            <MobileScreen>
                <div className="flex items-center justify-between px-6 pt-4">
                    <div
                        role="progressbar"
                        aria-valuemin={1}
                        aria-valuemax={STEPS.length}
                        aria-valuenow={step}
                        aria-label={t('onboarding.progress', {
                            current: step,
                            total: STEPS.length,
                        })}
                        className="flex gap-1.5"
                    >
                        {STEPS.map((number) => (
                            <span
                                key={number}
                                className={cn(
                                    'h-1 w-7 rounded-full',
                                    number <= step ? 'bg-brand' : 'bg-border',
                                )}
                            />
                        ))}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                            'text-muted-foreground',
                            step === 3 && 'invisible',
                        )}
                        onClick={skip}
                    >
                        {t('onboarding.skip')}
                    </Button>
                </div>

                <form
                    onSubmit={submit}
                    className="flex flex-1 flex-col gap-5 px-6 pt-7 pb-6"
                >
                    {step === 1 && (
                        <>
                            <div className="grid gap-1.5">
                                <h1 className="font-heading text-[21px] font-bold">
                                    {t('onboarding.identity.title')}
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    {t('onboarding.identity.description')}
                                </p>
                            </div>
                            <PhotoPicker
                                round
                                label={t('onboarding.identity.addLogo')}
                                onPick={(file) => form.setData('logo', file)}
                            />
                            <InputError
                                message={errors.logo}
                                className="text-center"
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    {t('onboarding.identity.storeName')}
                                </Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    placeholder={t(
                                        'onboarding.identity.storePlaceholder',
                                    )}
                                    className="h-11"
                                />
                                <InputError message={errors.name} />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="grid gap-1.5">
                                <h1 className="font-heading text-[21px] font-bold">
                                    {t('onboarding.product.title')}
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    {t('onboarding.product.description')}
                                </p>
                            </div>
                            <PhotoPicker
                                label={t('onboarding.product.addPhoto')}
                                onPick={(file) =>
                                    form.setData('product_photo', file)
                                }
                            />
                            <InputError
                                message={errors.product_photo}
                                className="text-center"
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="product_name">
                                    {t('onboarding.product.name')}
                                </Label>
                                <Input
                                    id="product_name"
                                    value={form.data.product_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'product_name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'onboarding.product.namePlaceholder',
                                    )}
                                    className="h-11"
                                />
                                <InputError message={errors.product_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="product_price">
                                    {t('onboarding.product.price')}
                                </Label>
                                <MoneyInput
                                    id="product_price"
                                    cents={form.data.product_price_cents}
                                    onCentsChange={(cents) =>
                                        form.setData(
                                            'product_price_cents',
                                            cents,
                                        )
                                    }
                                    placeholder={t(
                                        'onboarding.product.pricePlaceholder',
                                    )}
                                    className="h-11"
                                />
                                <InputError
                                    message={errors.product_price_cents}
                                />
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="grid gap-1.5">
                                <h1 className="font-heading text-[21px] font-bold">
                                    {t('onboarding.pix.title')}
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    {t('onboarding.pix.description')}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {PIX_TYPES.map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        aria-pressed={
                                            form.data.pix_key_type === type
                                        }
                                        onClick={() =>
                                            form.setData((data) => ({
                                                ...data,
                                                pix_key_type: type,
                                                pix_key: maskPixKey(
                                                    type,
                                                    data.pix_key,
                                                ),
                                            }))
                                        }
                                        className={cn(
                                            'focus-visible:ring-ring/50 rounded-full px-3.5 py-2 text-[13px] outline-none focus-visible:ring-[3px]',
                                            form.data.pix_key_type === type
                                                ? 'bg-brand/10 text-brand font-semibold'
                                                : 'bg-muted text-muted-foreground font-medium',
                                        )}
                                    >
                                        {t(`onboarding.pix.types.${type}`)}
                                    </button>
                                ))}
                            </div>
                            <InputError message={errors.pix_key_type} />
                            <div className="grid gap-2">
                                <Label htmlFor="pix_key">
                                    {t('onboarding.pix.key')}
                                </Label>
                                <Input
                                    id="pix_key"
                                    type={
                                        form.data.pix_key_type === 'email'
                                            ? 'email'
                                            : 'text'
                                    }
                                    required
                                    autoFocus
                                    value={form.data.pix_key}
                                    inputMode={pixKeyInputMode(
                                        form.data.pix_key_type,
                                    )}
                                    onChange={(event) =>
                                        form.setData(
                                            'pix_key',
                                            maskPixKey(
                                                form.data.pix_key_type,
                                                event.target.value,
                                            ),
                                        )
                                    }
                                    placeholder={t(
                                        `onboarding.pix.placeholders.${form.data.pix_key_type}`,
                                    )}
                                    className="h-11"
                                />
                                <InputError message={errors.pix_key} />
                            </div>
                        </>
                    )}

                    <Button
                        type="submit"
                        className="mt-auto h-12 text-base"
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner />}
                        {step === 3
                            ? t('onboarding.finish')
                            : t('onboarding.continue')}
                    </Button>
                </form>
            </MobileScreen>
        </>
    );
}
