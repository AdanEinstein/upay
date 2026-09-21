import { Link } from '@inertiajs/react';
import { CaretLeftIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// `back` is a URL; without it the button walks browser history.
export default function PageHeader({
    title,
    back,
    action,
}: {
    title: string;
    back?: string;
    action?: ReactNode;
}) {
    const { t } = useTranslation('shop');
    const className =
        'border-border bg-card inline-flex size-8 items-center justify-center rounded-full border';

    return (
        <header className="flex items-center gap-2.5 px-5 pt-4 pb-2">
            {back ? (
                <Link href={back} className={className} aria-label={t('common.back')}>
                    <CaretLeftIcon className="size-4" />
                </Link>
            ) : (
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className={className}
                    aria-label={t('common.back')}
                >
                    <CaretLeftIcon className="size-4" />
                </button>
            )}
            <span className="flex-1 text-[15px] font-semibold">{title}</span>
            {action}
        </header>
    );
}

