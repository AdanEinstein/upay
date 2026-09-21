import * as React from 'react';
import { cn } from 'cn';
import { CalendarBlankIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Calendar, type CalendarProps } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export type DatePickerProps = {
    value?: Date | null;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
    /** Locale para formatar a data exibida e o calendário. */
    locale?: string;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Repassado ao Calendar (ex.: disabled, weekStartsOn). */
    calendarProps?: Pick<
        CalendarProps,
        'disabled' | 'weekStartsOn' | 'showOutsideDays' | 'labels'
    >;
    className?: string;
};

function DatePicker({
    value,
    onChange,
    placeholder = 'Selecione uma data',
    disabled,
    minDate,
    maxDate,
    locale = 'pt-BR',
    open,
    defaultOpen,
    onOpenChange,
    calendarProps,
    className,
}: DatePickerProps) {
    const [innerOpen, setInnerOpen] = React.useState(defaultOpen ?? false);
    const isOpen = open ?? innerOpen;
    const setOpen = (o: boolean) => {
        if (open === undefined) setInnerOpen(o);
        onOpenChange?.(o);
    };
    const text = value
        ? new Intl.DateTimeFormat(locale, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          }).format(value)
        : placeholder;

    return (
        <Popover open={isOpen} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    data-empty={!value || undefined}
                    className={cn(
                        'data-empty:text-muted-foreground w-56 justify-start font-normal tabular-nums',
                        className,
                    )}
                >
                    <CalendarBlankIcon data-icon="inline-start" />
                    {text}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(d) => {
                        onChange?.(d);
                        if (d) setOpen(false);
                    }}
                    minDate={minDate}
                    maxDate={maxDate}
                    locale={locale}
                    {...calendarProps}
                />
            </PopoverContent>
        </Popover>
    );
}

export { DatePicker };
