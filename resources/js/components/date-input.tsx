import { useTranslation } from 'react-i18next';
import { brandScope } from '@/components/mobile-screen';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';

// Forms keep dates as "YYYY-MM-DD" (the server format); DatePicker works with local Dates.
function parseIsoDate(value?: string): Date | undefined {
    if (!value) {
        return undefined;
    }

    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
}

export default function DateInput({
    value,
    onValueChange,
    min,
    max,
    id,
    className,
    'aria-label': ariaLabel,
}: {
    value: string;
    onValueChange: (value: string) => void;
    min?: string;
    max?: string;
    id?: string;
    className?: string;
    'aria-label'?: string;
}) {
    const { t, i18n } = useTranslation();

    return (
        <DatePicker
            id={id}
            aria-label={ariaLabel}
            value={parseIsoDate(value)}
            onChange={(date) =>
                onValueChange(date ? date.toLocaleDateString('en-CA') : '')
            }
            minDate={parseIsoDate(min)}
            maxDate={parseIsoDate(max)}
            locale={i18n.resolvedLanguage}
            placeholder={t('datePicker.placeholder')}
            calendarProps={{
                labels: {
                    previousMonth: t('datePicker.previousMonth'),
                    nextMonth: t('datePicker.nextMonth'),
                },
            }}
            className={cn('h-11 w-full', className)}
            contentClassName={brandScope}
        />
    );
}
