import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import { Chip } from '@/components/shop/chip';
import PageHeader from '@/components/shop/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { maskPixKey, pixKeyInputMode } from '@/lib/pix';
import type { PixKeyType } from '@/lib/pix';
import { show } from '@/routes/more';
import { update } from '@/routes/pix-key';

const TYPES = ['email', 'phone', 'cpf', 'cnpj', 'random'] as const;

export default function PixKey({ pixKeyType, pixKey }: { pixKeyType: (typeof TYPES)[number]; pixKey: string }) {
    const { t } = useTranslation('shop');
    const form = useForm({ pix_key_type: pixKeyType, pix_key: maskPixKey(pixKeyType, pixKey) });

    function changeType(type: PixKeyType) {
        form.setData((data) => ({ ...data, pix_key_type: type, pix_key: maskPixKey(type, data.pix_key) }));
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(update.url());
    }

    return (
        <>
            <Head title={t('pix.title')} />
            <PageHeader title={t('pix.title')} back={show.url()} />

            <form onSubmit={submit} className="flex flex-col gap-4 px-5 pt-2 lg:max-w-[440px]">
                <div>
                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">{t('pix.type')}</p>
                    <div className="flex flex-wrap gap-2">
                        {TYPES.map((key) => (
                            <Chip key={key} active={form.data.pix_key_type === key} onClick={() => changeType(key)}>
                                {t(`pix.types.${key}`)}
                            </Chip>
                        ))}
                    </div>
                    <InputError message={form.errors.pix_key_type} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="pix-key">{t('pix.key')}</Label>
                    <Input
                        id="pix-key"
                        type={form.data.pix_key_type === 'email' ? 'email' : 'text'}
                        inputMode={pixKeyInputMode(form.data.pix_key_type)}
                        autoComplete="off"
                        value={form.data.pix_key}
                        onChange={(event) => form.setData('pix_key', maskPixKey(form.data.pix_key_type, event.target.value))}
                        className="h-11"
                    />
                    <InputError message={form.errors.pix_key} />
                </div>
                <Button type="submit" size="lg" className="h-12 text-base" disabled={form.processing}>
                    {t('pix.save')}
                </Button>
            </form>
        </>
    );
}
