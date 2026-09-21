import { Head, useForm } from '@inertiajs/react';
import { PencilSimpleIcon, PlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import MoneyInput from '@/components/money-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMoney } from '@/lib/money';
import { store, update } from '@/routes/super-admin/plans';

type Plan = {
    id: number;
    name: string;
    priceCents: number;
    annualPriceCents: number | null;
    limits: Record<string, number | null>;
    active: boolean;
    featured: boolean;
    organizationsCount: number;
};

type Props = { plans: Plan[]; limitKeys: string[] };

// `null` = closed, `'create'` = new plan, a Plan = editing it.
type DialogState = null | 'create' | Plan;

function PlanForm({
    plan,
    limitKeys,
    onDone,
}: {
    plan: Plan | null;
    limitKeys: string[];
    onDone: () => void;
}) {
    const { t } = useTranslation(['super', 'common']);
    const form = useForm({
        name: plan?.name ?? '',
        price_cents: plan?.priceCents ?? (null as number | null),
        annual_price_cents: plan?.annualPriceCents ?? (null as number | null),
        limits: Object.fromEntries(
            limitKeys.map((key) => [key, plan?.limits[key] ?? null]),
        ) as Record<string, number | null>,
        active: plan?.active ?? true,
        featured: plan?.featured ?? false,
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t(plan ? 'plans.toast.updated' : 'plans.toast.created'),
                );
                onDone();
            },
        };

        if (plan) {
            form.put(update(plan.id).url, options);
        } else {
            form.post(store().url, options);
        }
    }

    const { errors } = form;

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="name">{t('plans.form.name')}</Label>
                <Input
                    id="name"
                    value={form.data.name}
                    onChange={(event) =>
                        form.setData('name', event.target.value)
                    }
                    required
                    autoFocus
                />
                <InputError message={errors.name} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label htmlFor="price">{t('plans.form.price')}</Label>
                    <MoneyInput
                        id="price"
                        cents={form.data.price_cents}
                        onCentsChange={(cents) =>
                            form.setData('price_cents', cents)
                        }
                        required
                    />
                    <InputError message={errors.price_cents} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="annual_price">
                        {t('plans.form.annualPrice')}
                    </Label>
                    <MoneyInput
                        id="annual_price"
                        cents={form.data.annual_price_cents}
                        onCentsChange={(cents) =>
                            form.setData('annual_price_cents', cents)
                        }
                    />
                    <InputError message={errors.annual_price_cents} />
                </div>
            </div>

            <fieldset className="space-y-3 border-t pt-4">
                <legend className="text-sm font-medium">
                    {t('plans.form.limits')}
                </legend>
                <div className="grid grid-cols-2 gap-3">
                    {limitKeys.map((key) => (
                        <div key={key} className="grid gap-2">
                            <Label htmlFor={key}>
                                {t(`plans.form.limitLabels.${key}`)}
                            </Label>
                            <Input
                                id={key}
                                type="number"
                                min={0}
                                inputMode="numeric"
                                placeholder={t('plans.form.unlimited')}
                                value={form.data.limits[key] ?? ''}
                                onChange={(event) =>
                                    form.setData('limits', {
                                        ...form.data.limits,
                                        [key]:
                                            event.target.value === ''
                                                ? null
                                                : Number(event.target.value),
                                    })
                                }
                            />
                            <InputError
                                message={
                                    errors[
                                        `limits.${key}` as keyof typeof errors
                                    ]
                                }
                            />
                        </div>
                    ))}
                </div>
            </fieldset>

            <div className="space-y-3">
                <Label className="font-normal">
                    <Checkbox
                        checked={form.data.active}
                        onCheckedChange={(checked) =>
                            form.setData('active', checked === true)
                        }
                    />
                    {t('plans.form.active')}
                </Label>
                <Label className="font-normal">
                    <Checkbox
                        checked={form.data.featured}
                        onCheckedChange={(checked) =>
                            form.setData('featured', checked === true)
                        }
                    />
                    {t('plans.form.featured')}
                </Label>
            </div>

            <DialogFooter className="gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        {t('common:cancel')}
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={form.processing}>
                    {t('plans.form.save')}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function Plans({ plans, limitKeys }: Props) {
    const { t, i18n } = useTranslation(['super', 'common']);
    const [dialog, setDialog] = useState<DialogState>(null);
    const editing = dialog !== null && dialog !== 'create' ? dialog : null;

    return (
        <>
            <Head title={t('plans.title')} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={t('plans.heading')}
                        description={t('plans.description')}
                    />
                    <Button onClick={() => setDialog('create')}>
                        <PlusIcon />
                        {t('plans.new')}
                    </Button>
                </div>

                {plans.length === 0 ? (
                    <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
                        {t('plans.empty')}
                    </p>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {plans.map((plan) => (
                            <Card key={plan.id} size="sm">
                                <CardContent className="flex items-center justify-between gap-3">
                                    <div className="grid gap-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold">
                                                {plan.name}
                                            </span>
                                            {plan.featured && (
                                                <Badge>
                                                    {t('plans.popular')}
                                                </Badge>
                                            )}
                                            <Badge
                                                variant={
                                                    plan.active
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {t(
                                                    plan.active
                                                        ? 'plans.active'
                                                        : 'plans.inactive',
                                                )}
                                            </Badge>
                                        </div>
                                        <span className="text-muted-foreground text-sm">
                                            {t('plans.summary', {
                                                price: formatMoney(
                                                    plan.priceCents,
                                                    i18n.resolvedLanguage,
                                                ),
                                                count: plan.organizationsCount,
                                            })}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={t('plans.edit')}
                                        onClick={() => setDialog(plan)}
                                    >
                                        <PencilSimpleIcon />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog
                open={dialog !== null}
                onOpenChange={(open) => !open && setDialog(null)}
            >
                <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                editing
                                    ? 'plans.form.editTitle'
                                    : 'plans.form.createTitle',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t('plans.form.description')}
                        </DialogDescription>
                    </DialogHeader>
                    {dialog !== null && (
                        <PlanForm
                            // Remount per target so state and errors never leak between plans.
                            key={editing?.id ?? 'create'}
                            plan={editing}
                            limitKeys={limitKeys}
                            onDone={() => setDialog(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
