import * as React from 'react';
import { cn } from 'cn';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';

export type DateRange = { from?: Date; to?: Date };

type CalendarBaseProps = {
    /** Mês exibido (controlado). */
    month?: Date;
    /** Mês inicial quando não controlado. Padrão: mês da data selecionada ou hoje. */
    defaultMonth?: Date;
    onMonthChange?: (month: Date) => void;
    /** Retorna true para datas que não podem ser escolhidas. */
    disabled?: (date: Date) => boolean;
    minDate?: Date;
    maxDate?: Date;
    /** Locale usado para nomes de mês e dias da semana. */
    locale?: string;
    /** 0 = domingo, 1 = segunda... */
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    showOutsideDays?: boolean;
    labels?: { previousMonth?: string; nextMonth?: string };
    className?: string;
};

export type CalendarProps = CalendarBaseProps &
    (
        | {
              mode?: 'single';
              selected?: Date | null;
              onSelect?: (date: Date | undefined) => void;
          }
        | {
              mode: 'range';
              selected?: DateRange;
              onSelect?: (range: DateRange | undefined) => void;
          }
    );

const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) =>
    new Date(d.getFullYear(), d.getMonth() + n, 1);
const isSameDay = (a?: Date | null, b?: Date | null) =>
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

function Calendar({
    mode = 'single',
    selected,
    onSelect,
    month,
    defaultMonth,
    onMonthChange,
    disabled,
    minDate,
    maxDate,
    locale = 'pt-BR',
    weekStartsOn = 0,
    showOutsideDays = true,
    labels,
    className,
}: CalendarProps) {
    const anchor =
        mode === 'range'
            ? (selected as DateRange | undefined)?.from
            : (selected as Date | null | undefined);
    const [innerMonth, setInnerMonth] = React.useState(() =>
        addMonths(defaultMonth ?? anchor ?? new Date(), 0),
    );
    const shownMonth = month ?? innerMonth;
    const [focused, setFocused] = React.useState<Date | null>(null);
    const gridRef = React.useRef<HTMLDivElement>(null);

    const setMonth = (m: Date) => {
        if (month === undefined) setInnerMonth(m);
        onMonthChange?.(m);
    };

    const today = startOfDay(new Date());
    const isDisabled = (d: Date) =>
        !!disabled?.(d) ||
        (!!minDate && d < startOfDay(minDate)) ||
        (!!maxDate && d > startOfDay(maxDate));

    const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const weekdays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(2023, 0, 1 + ((weekStartsOn + i) % 7)); // 1/jan/2023 é domingo
        return {
            short: weekdayFmt.format(d).replace('.', '').slice(0, 3),
            long: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(
                d,
            ),
        };
    });

    const first = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), 1);
    const lead = (first.getDay() - weekStartsOn + 7) % 7;
    const gridStart = addDays(first, -lead);
    const weeks = Array.from({ length: 6 }, (_, w) =>
        Array.from({ length: 7 }, (_, i) => addDays(gridStart, w * 7 + i)),
    );

    const rawCaption = new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
    }).format(first);
    const caption = rawCaption.charAt(0).toUpperCase() + rawCaption.slice(1);
    const dayLabel = new Intl.DateTimeFormat(locale, { dateStyle: 'full' });

    const range =
        mode === 'range' ? (selected as DateRange | undefined) : undefined;

    const pick = (d: Date) => {
        if (isDisabled(d)) return;
        if (mode === 'range') {
            const cur = range ?? {};
            let next: DateRange;
            if (!cur.from || cur.to) next = { from: d };
            else
                next =
                    d < cur.from
                        ? { from: d, to: cur.from }
                        : { from: cur.from, to: d };
            (onSelect as ((r: DateRange | undefined) => void) | undefined)?.(
                next,
            );
        } else {
            (onSelect as ((d: Date | undefined) => void) | undefined)?.(
                isSameDay(d, selected as Date | null) ? undefined : d,
            );
        }
        if (d.getMonth() !== first.getMonth()) setMonth(addMonths(d, 0));
    };

    const activeDay =
        focused ??
        (anchor &&
        anchor.getMonth() === first.getMonth() &&
        anchor.getFullYear() === first.getFullYear()
            ? anchor
            : first);

    const focusDay = (d: Date) => {
        setFocused(d);
        if (
            d.getMonth() !== first.getMonth() ||
            d.getFullYear() !== first.getFullYear()
        )
            setMonth(addMonths(d, 0));
        requestAnimationFrame(() =>
            gridRef.current
                ?.querySelector<HTMLElement>(
                    `[data-date="${d.getFullYear()}-${d.getMonth()}-${d.getDate()}"]`,
                )
                ?.focus(),
        );
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const base = activeDay;
        const map: Record<string, Date> = {
            ArrowLeft: addDays(base, -1),
            ArrowRight: addDays(base, 1),
            ArrowUp: addDays(base, -7),
            ArrowDown: addDays(base, 7),
            PageUp: new Date(
                base.getFullYear(),
                base.getMonth() - 1,
                base.getDate(),
            ),
            PageDown: new Date(
                base.getFullYear(),
                base.getMonth() + 1,
                base.getDate(),
            ),
            Home: addDays(base, -((base.getDay() - weekStartsOn + 7) % 7)),
            End: addDays(base, 6 - ((base.getDay() - weekStartsOn + 7) % 7)),
        };
        if (map[e.key]) {
            e.preventDefault();
            focusDay(map[e.key]);
        }
    };

    return (
        <div
            data-slot="calendar"
            className={cn('w-fit text-sm select-none', className)}
        >
            <div className="mb-2 flex items-center justify-between">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={labels?.previousMonth ?? 'Mês anterior'}
                    onClick={() => setMonth(addMonths(first, -1))}
                >
                    <CaretLeftIcon />
                </Button>
                <div
                    data-slot="calendar-caption"
                    aria-live="polite"
                    className="font-heading text-sm font-medium"
                >
                    {caption}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={labels?.nextMonth ?? 'Próximo mês'}
                    onClick={() => setMonth(addMonths(first, 1))}
                >
                    <CaretRightIcon />
                </Button>
            </div>
            <div
                ref={gridRef}
                role="grid"
                aria-label={caption}
                onKeyDown={onKeyDown}
                className="grid gap-y-1"
            >
                <div role="row" className="grid grid-cols-7">
                    {weekdays.map((w) => (
                        <div
                            key={w.long}
                            role="columnheader"
                            aria-label={w.long}
                            className="text-muted-foreground flex size-9 items-center justify-center text-xs capitalize"
                        >
                            {w.short}
                        </div>
                    ))}
                </div>
                {weeks.map((week, wi) => (
                    <div key={wi} role="row" className="grid grid-cols-7">
                        {week.map((d) => {
                            const outside = d.getMonth() !== first.getMonth();
                            if (outside && !showOutsideDays)
                                return (
                                    <div
                                        key={d.toISOString()}
                                        role="gridcell"
                                        className="size-9"
                                    />
                                );
                            const isSel =
                                mode === 'range'
                                    ? isSameDay(d, range?.from) ||
                                      isSameDay(d, range?.to)
                                    : isSameDay(d, selected as Date | null);
                            const inRange =
                                !!range?.from &&
                                !!range?.to &&
                                d > range.from &&
                                d < range.to;
                            const isStart =
                                mode === 'range' &&
                                isSameDay(d, range?.from) &&
                                !!range?.to;
                            const isEnd =
                                mode === 'range' && isSameDay(d, range?.to);
                            const off = isDisabled(d);
                            return (
                                <div
                                    key={d.toISOString()}
                                    role="gridcell"
                                    aria-selected={isSel || inRange}
                                    className={cn(
                                        'flex size-9 items-center justify-center',
                                        inRange && 'bg-muted',
                                        isStart && 'bg-muted rounded-l-full',
                                        isEnd &&
                                            range?.from &&
                                            !isSameDay(range.from, range.to) &&
                                            'bg-muted rounded-r-full',
                                    )}
                                >
                                    <button
                                        type="button"
                                        data-slot="calendar-day"
                                        data-date={`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`}
                                        data-selected={isSel || undefined}
                                        data-today={
                                            isSameDay(d, today) || undefined
                                        }
                                        data-outside={outside || undefined}
                                        tabIndex={
                                            isSameDay(d, activeDay) ? 0 : -1
                                        }
                                        disabled={off}
                                        aria-label={dayLabel.format(d)}
                                        aria-current={
                                            isSameDay(d, today)
                                                ? 'date'
                                                : undefined
                                        }
                                        onClick={() => pick(d)}
                                        onFocus={() => setFocused(d)}
                                        className={cn(
                                            'hover:bg-muted focus-visible:ring-ring/50 flex size-8 items-center justify-center rounded-full text-sm transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-40',
                                            outside &&
                                                'text-muted-foreground/60',
                                            isSameDay(d, today) &&
                                                !isSel &&
                                                'bg-muted font-medium',
                                            isSel &&
                                                'bg-primary text-primary-foreground hover:bg-primary/90 font-medium',
                                        )}
                                    >
                                        {d.getDate()}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

export { Calendar };
