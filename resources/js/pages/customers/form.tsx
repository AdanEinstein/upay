import { Head, Link, useForm } from '@inertiajs/react';
import { CaretDownIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import InputError from '@/components/input-error';
import PageHeader from '@/components/shop/page-header';
import Textarea from '@/components/shop/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { maskDocument, maskPhone } from '@/lib/mask';
import { cn } from '@/lib/utils';
import { formatPhone } from '@/lib/whatsapp';
import { index, show, store, update } from '@/routes/customers';

type Customer = {
    id: number;
    name: string;
    phone: string | null;
    document: string | null;
    address: string | null;
    notes: string | null;
};

export default function CustomerForm({
    customer,
}: {
    customer: Customer | null;
}) {
    const { t } = useTranslation('shop');
    const [more, setMore] = useState(
        Boolean(customer?.document || customer?.address),
    );
    const form = useForm({
        name: customer?.name ?? '',
        phone: customer?.phone ? formatPhone(customer.phone) : '',
        notes: customer?.notes ?? '',
        document: customer?.document ? maskDocument(customer.document) : '',
        address: customer?.address ?? '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        if (customer) {
            form.put(update.url({ customer: customer.id }));
        } else {
            form.post(store.url());
        }
    }

    const title = customer
        ? t('customers.form.editTitle')
        : t('customers.form.newTitle');

    return (
        <>
            <Head title={title} />
            <PageHeader
                title={title}
                back={
                    customer ? show.url({ customer: customer.id }) : index.url()
                }
            />

            <form
                onSubmit={submit}
                className="lg:bg-card lg:border-border flex flex-col gap-3.5 px-5 pt-2 lg:mx-auto lg:mt-6 lg:w-[460px] lg:rounded-2xl lg:border lg:p-7"
            >
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name">{t('customers.form.name')}</Label>
                    <Input
                        id="name"
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                        placeholder={t('customers.form.namePlaceholder')}
                        className="h-11"
                        autoFocus
                    />
                    <InputError message={form.errors.name} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="phone">
                        {t('customers.form.whatsapp')}
                    </Label>
                    <Input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        value={form.data.phone}
                        onChange={(event) =>
                            form.setData('phone', maskPhone(event.target.value))
                        }
                        placeholder={t('customers.form.whatsappPlaceholder')}
                        className="h-11"
                    />
                    <InputError message={form.errors.phone} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="notes">{t('customers.form.notes')}</Label>
                    <Textarea
                        id="notes"
                        value={form.data.notes}
                        onChange={(event) =>
                            form.setData('notes', event.target.value)
                        }
                        placeholder={t('customers.form.notesPlaceholder')}
                    />
                    <InputError message={form.errors.notes} />
                </div>
                <button
                    type="button"
                    onClick={() => setMore(!more)}
                    className="text-brand flex items-center gap-1.5 py-1 text-[13.5px] font-semibold"
                >
                    {t('customers.form.more')}
                    <CaretDownIcon
                        className={cn(
                            'size-3.5 transition-transform',
                            more && 'rotate-180',
                        )}
                        weight="bold"
                    />
                </button>
                {more && (
                    <>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="document">
                                {t('customers.form.document')}
                            </Label>
                            <Input
                                id="document"
                                inputMode="numeric"
                                value={form.data.document}
                                onChange={(event) =>
                                    form.setData(
                                        'document',
                                        maskDocument(event.target.value),
                                    )
                                }
                                placeholder={t(
                                    'customers.form.documentPlaceholder',
                                )}
                                className="h-11"
                            />
                            <InputError message={form.errors.document} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="address">
                                {t('customers.form.address')}
                            </Label>
                            <Input
                                id="address"
                                value={form.data.address}
                                onChange={(event) =>
                                    form.setData('address', event.target.value)
                                }
                                placeholder={t(
                                    'customers.form.addressPlaceholder',
                                )}
                                className="h-11"
                            />
                            <InputError message={form.errors.address} />
                        </div>
                    </>
                )}
                <div className="flex flex-col gap-3.5 lg:flex-row-reverse lg:gap-2.5">
                    <Button
                        type="submit"
                        size="lg"
                        className="mt-2 h-12 text-base lg:mt-0 lg:h-11 lg:flex-1"
                        disabled={form.processing}
                    >
                        {t('customers.form.save')}
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        className="hidden h-11 lg:inline-flex lg:flex-1"
                    >
                        <Link
                            href={
                                customer
                                    ? show.url({ customer: customer.id })
                                    : index.url()
                            }
                        >
                            {t('common.cancel')}
                        </Link>
                    </Button>
                </div>
            </form>
        </>
    );
}
