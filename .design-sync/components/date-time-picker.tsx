import * as React from 'react';
import { cn } from 'cn';
import { CalendarBlankIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Calendar, type CalendarProps } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { TimeColumns } from './time-picker';

export type DateTimePickerProps = {
    value?: Date | null;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
    minuteStep?: number;
    locale?: string;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    calendarProps?: Pick<
        CalendarProps,
        'disabled' | 'weekStartsOn' | 'showOutsideDays' | 'labels'
    >;
    labels?: { hours?: string; minutes?: string };
    className?: string;
};

const pad = (n: number) => String(n).padStart(2, '0');

function DateTimePicker({
    value,
    onChange,
    placeholder = 'Selecione data e hora',
    disabled,
    minDate,
    maxDate,
    minuteStep = 5,
    locale = 'pt-BR',
    open,
    defaultOpen,
    onOpenChange,
    calendarProps,
    labels,
    className,
}: DateTimePickerProps) {
    const [innerOpen, setInnerOpen] = React.useState(defaultOpen ?? false);
    const isOpen = open ?? innerOpen;
    const setOpen = (o: boolean) => {
        if (open === undefined) setInnerOpen(o);
        onOpenChange?.(o);
    };
    const text = value
        ? `${new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(value)} ${pad(value.getHours())}:${pad(value.getMinutes())}`
        : placeholder;

    const withDate = (d: Date | undefined) => {
        if (!d) return onChange?.(undefined);
        onChange?.(
            new Date(
                d.getFullYear(),
                d.getMonth(),
                d.getDate(),
                value?.getHours() ?? 0,
                value?.getMinutes() ?? 0,
            ),
        );
    };
    const withTime = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        const base = value ?? new Date();
        onChange?.(
            new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m),
        );
    };

    return (
        <Popover open={isOpen} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    data-empty={!value || undefined}
                    className={cn(
                        'data-empty:text-muted-foreground w-64 justify-start font-normal tabular-nums',
                        className,
                    )}
                >
                    <CalendarBlankIcon data-icon="inline-start" />
                    {text}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto">
                <div className="flex gap-3">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={withDate}
                        minDate={minDate}
                        maxDate={maxDate}
                        locale={locale}
                        {...calendarProps}
                    />
                    <div className="bg-border w-px" />
                    <TimeColumns
                        value={
                            value
                                ? `${pad(value.getHours())}:${pad(value.getMinutes())}`
                                : null
                        }
                        onChange={withTime}
                        minuteStep={minuteStep}
                        labels={labels}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}

export { DateTimePicker };
