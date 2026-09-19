import { Head, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import i18n from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { edit, update } from '@/routes/locale';

const LOCALES = [
    { value: 'pt_BR', label: 'Português (Brasil)' },
    { value: 'en_US', label: 'English (US)' },
];

export default function Language() {
    const { t } = useTranslation('settings');
    const { locale } = usePage<{ locale: string }>().props;
    const currentValue = locale === 'en-US' ? 'en_US' : 'pt_BR';

    const handleChange = (value: string) => {
        router.put(update().url, { locale: value }, { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('settings:language.title')} />

            <h1 className="sr-only">{t('settings:language.title')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('settings:language.heading')}
                    description={t('settings:language.description')}
                />

                <div className="flex flex-wrap gap-2">
                    {LOCALES.map((option) => (
                        <Button
                            key={option.value}
                            type="button"
                            variant="outline"
                            className={cn(
                                currentValue === option.value &&
                                    'border-primary',
                            )}
                            onClick={() => handleChange(option.value)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>
        </>
    );
}

Language.layout = {
    breadcrumbs: [
        {
            title: i18n.t('settings:language.title'),
            href: edit(),
        },
    ],
};
