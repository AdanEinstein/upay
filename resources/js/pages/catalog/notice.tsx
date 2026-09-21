import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import { Chip } from '@/components/shop/chip';
import { NOTICE_STYLES } from '@/components/shop/notice-styles';
import type { NoticeType } from '@/components/shop/notice-styles';
import PageHeader from '@/components/shop/page-header';
import Textarea from '@/components/shop/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { show } from '@/routes/catalog';
import { update } from '@/routes/catalog/notice';

export default function CatalogNotice({ text, type, expiresOn, active }: { text: string; type: NoticeType; expiresOn: string | null; active: boolean }) {
    const { t } = useTranslation('shop');
    const form = useForm({ notice_text: text, notice_type: type, notice_expires_on: expiresOn ?? '', notice_active: active });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({ ...data, notice_expires_on: data.notice_expires_on || null }));
        form.put(update.url());
    }

    return (
        <>
            <Head title={t('catalog.noticeForm.title')} />
            <PageHeader title={t('catalog.noticeForm.title')} back={show.url()} />

            <form onSubmit={submit} className="flex flex-col gap-4 px-5 pt-2">
                <div>
                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">{t('catalog.noticeForm.previewLabel')}</p>
                    <div className={cn('min-h-10 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold', NOTICE_STYLES[form.data.notice_type])}>
                        {form.data.notice_text}
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                        <Label htmlFor="notice-text">{t('catalog.noticeForm.text')}</Label>
                        <span className="text-muted-foreground text-xs">{form.data.notice_text.length}/120</span>
                    </div>
                    <Textarea id="notice-text" maxLength={120} value={form.data.notice_text} onChange={(event) => form.setData('notice_text', event.target.value)} placeholder={t('catalog.noticeForm.placeholder')} className="min-h-16" />
                    <InputError message={form.errors.notice_text} />
                </div>
                <div>
                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">{t('catalog.noticeForm.type')}</p>
                    <div className="flex gap-2">
                        {(Object.keys(NOTICE_STYLES) as NoticeType[]).map((key) => (
                            <Chip key={key} active={form.data.notice_type === key} onClick={() => form.setData('notice_type', key)}>
                                {t(`catalog.noticeForm.types.${key}`)}
                            </Chip>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="expires">{t('catalog.noticeForm.expires')}</Label>
                    <Input id="expires" type="date" min={new Date().toLocaleDateString('en-CA')} value={form.data.notice_expires_on} onChange={(event) => form.setData('notice_expires_on', event.target.value)} className="h-11" />
                    <InputError message={form.errors.notice_expires_on} />
                </div>
                <label className="flex items-center gap-2.5 text-sm">
                    <Checkbox checked={form.data.notice_active} onCheckedChange={(checked) => form.setData('notice_active', checked === true)} />
                    {t('catalog.noticeForm.active')}
                </label>
                <Button type="submit" size="lg" className="h-12 text-base" disabled={form.processing}>
                    {t('catalog.noticeForm.save')}
                </Button>
            </form>
        </>
    );
}
