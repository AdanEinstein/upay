import { Head, Link, useForm } from '@inertiajs/react';
import { CameraIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import DateInput from '@/components/date-input';
import InputError from '@/components/input-error';
import MoneyInput from '@/components/money-input';
import PhotoInput from '@/components/photo-input';
import { Chip } from '@/components/shop/chip';
import PageHeader from '@/components/shop/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index, store, update } from '@/routes/expenses';

type Expense = {
    id: number;
    amountCents: number;
    category: string;
    dueDate: string;
    description: string;
    recurring: boolean;
    paid: boolean;
    receiptUrl: string | null;
};

const CATEGORIES = [
    'suppliers',
    'rent',
    'transport',
    'marketing',
    'other',
] as const;

export default function ExpenseForm({ expense }: { expense: Expense | null }) {
    const { t } = useTranslation('shop');
    const [preview, setPreview] = useState<string | null>(
        expense?.receiptUrl ?? null,
    );
    const form = useForm({
        amount_cents: (expense?.amountCents ?? null) as number | null,
        category: expense?.category ?? 'suppliers',
        due_date: expense?.dueDate ?? new Date().toLocaleDateString('en-CA'),
        description: expense?.description ?? '',
        receipt: null as File | null,
        recurring: expense?.recurring ?? false,
        paid: expense?.paid ?? true,
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        if (expense) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(update.url({ expense: expense.id }), {
                forceFormData: true,
            });
        } else {
            form.post(store.url(), { forceFormData: true });
        }
    }

    const title = expense
        ? t('expenses.form.editTitle')
        : t('expenses.form.newTitle');

    return (
        <>
            <Head title={title} />
            <PageHeader title={title} back={index.url()} />

            <form
                onSubmit={submit}
                className="lg:bg-card flex flex-col gap-4 px-5 pt-2 lg:mx-auto lg:mt-4 lg:w-[460px] lg:rounded-2xl lg:border lg:p-7"
            >
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="amount">{t('expenses.form.amount')}</Label>
                    <MoneyInput
                        id="amount"
                        cents={form.data.amount_cents}
                        onCentsChange={(cents) =>
                            form.setData('amount_cents', cents)
                        }
                        placeholder={t('expenses.form.amountPlaceholder')}
                        className="h-11"
                        autoFocus
                    />
                    <InputError message={form.errors.amount_cents} />
                </div>
                <div>
                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">
                        {t('expenses.form.category')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((key) => (
                            <Chip
                                key={key}
                                active={form.data.category === key}
                                onClick={() => form.setData('category', key)}
                            >
                                {t(`expenses.categories.${key}`)}
                            </Chip>
                        ))}
                    </div>
                    <InputError message={form.errors.category} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="due-date">{t('expenses.form.date')}</Label>
                    <DateInput
                        id="due-date"
                        value={form.data.due_date}
                        onValueChange={(value) =>
                            form.setData('due_date', value)
                        }
                    />
                    <InputError message={form.errors.due_date} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="description">
                        {t('expenses.form.description')}
                    </Label>
                    <Input
                        id="description"
                        value={form.data.description}
                        onChange={(event) =>
                            form.setData('description', event.target.value)
                        }
                        placeholder={t('expenses.form.descriptionPlaceholder')}
                        className="h-11"
                    />
                    <InputError message={form.errors.description} />
                </div>
                <div>
                    <p className="text-muted-foreground mb-2 text-[13px] font-semibold">
                        {t('expenses.form.receipt')}
                    </p>
                    <label className="border-border text-muted-foreground hover:border-primary/50 has-[:focus-visible]:ring-ring/50 flex h-[100px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors has-[:focus-visible]:ring-[3px]">
                        <PhotoInput
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => {
                                const file = event.target.files?.[0];

                                if (file) {
                                    form.setData('receipt', file);
                                    setPreview(URL.createObjectURL(file));
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
                            <span className="flex items-center gap-2 text-[13px]">
                                <CameraIcon className="size-5" />
                                {t('expenses.form.receiptPhoto')}
                            </span>
                        )}
                    </label>
                    <InputError message={form.errors.receipt} />
                </div>
                <label className="flex items-center gap-2.5 text-sm">
                    <Checkbox
                        checked={form.data.recurring}
                        onCheckedChange={(checked) =>
                            form.setData('recurring', checked === true)
                        }
                    />
                    {t('expenses.form.recurring')}
                </label>
                <label className="flex items-center gap-2.5 text-sm">
                    <Checkbox
                        checked={form.data.paid}
                        onCheckedChange={(checked) =>
                            form.setData('paid', checked === true)
                        }
                    />
                    {t('expenses.form.paid')}
                </label>
                <div className="flex gap-2.5">
                    <Button
                        asChild
                        variant="ghost"
                        size="lg"
                        className="hidden h-11 flex-1 lg:inline-flex"
                    >
                        <Link href={index.url()}>{t('common.cancel')}</Link>
                    </Button>
                    <Button
                        type="submit"
                        size="lg"
                        className="h-12 flex-1 text-base lg:h-11"
                        disabled={form.processing}
                    >
                        {t('expenses.form.save')}
                    </Button>
                </div>
            </form>
        </>
    );
}
