import * as React from "react"
import { cn } from "cn"
import { ClockIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

const pad = (n: number) => String(n).padStart(2, "0")

export type TimeColumnsProps = {
    /** Horário no formato "HH:mm" (24h). */
    value?: string | null
    onChange?: (value: string) => void
    /** Intervalo, em minutos, entre as opções da coluna de minutos. */
    minuteStep?: number
    /** Chamado após escolher os minutos. */
    onMinutePicked?: () => void
    labels?: { hours?: string; minutes?: string }
    className?: string
}

function TimeColumns({ value, onChange, minuteStep = 5, onMinutePicked, labels, className }: TimeColumnsProps) {
    const [hh, mm] = value ? value.split(":").map(Number) : [undefined, undefined]
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep)
    const hourRef = React.useRef<HTMLButtonElement>(null)
    const minuteRef = React.useRef<HTMLButtonElement>(null)

    React.useEffect(() => {
        hourRef.current?.scrollIntoView({ block: "center" })
        minuteRef.current?.scrollIntoView({ block: "center" })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const item = (selected: boolean) =>
        cn(
            "flex h-8 w-full shrink-0 items-center justify-center rounded-full text-sm tabular-nums transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50",
            selected && "bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        )

    const listbox =
        "flex min-h-0 w-14 flex-1 flex-col gap-0.5 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:color-mix(in_oklab,var(--muted-foreground)_30%,transparent)_transparent]"
    const column = "flex min-h-0 flex-col items-center gap-1"

    return (
        <div data-slot="time-columns" className={cn("flex h-full max-h-80 min-h-56 gap-2", className)}>
            <div className={column}>
                <span className="text-muted-foreground text-xs">{labels?.hours ?? "Horas"}</span>
                <div role="listbox" aria-label={labels?.hours ?? "Horas"} className={listbox}>
                    {hours.map((h) => (
                        <button key={h} ref={h === hh ? hourRef : undefined} type="button" role="option" aria-selected={h === hh} className={item(h === hh)} onClick={() => onChange?.(`${pad(h)}:${pad(mm ?? 0)}`)}>
                            {pad(h)}
                        </button>
                    ))}
                </div>
            </div>
            <div className={column}>
                <span className="text-muted-foreground text-xs">{labels?.minutes ?? "Minutos"}</span>
                <div role="listbox" aria-label={labels?.minutes ?? "Minutos"} className={listbox}>
                    {minutes.map((m) => (
                        <button
                            key={m}
                            ref={m === mm ? minuteRef : undefined}
                            type="button"
                            role="option"
                            aria-selected={m === mm}
                            className={item(m === mm)}
                            onClick={() => {
                                onChange?.(`${pad(hh ?? 0)}:${pad(m)}`)
                                onMinutePicked?.()
                            }}
                        >
                            {pad(m)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export type TimePickerProps = {
    /** Horário no formato "HH:mm" (24h). */
    value?: string | null
    onChange?: (value: string) => void
    placeholder?: string
    disabled?: boolean
    minuteStep?: number
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    labels?: { hours?: string; minutes?: string }
    className?: string
}

function TimePicker({ value, onChange, placeholder = "Selecione o horário", disabled, minuteStep = 5, open, defaultOpen, onOpenChange, labels, className }: TimePickerProps) {
    const [innerOpen, setInnerOpen] = React.useState(defaultOpen ?? false)
    const isOpen = open ?? innerOpen
    const setOpen = (o: boolean) => {
        if (open === undefined) setInnerOpen(o)
        onOpenChange?.(o)
    }

    return (
        <Popover open={isOpen} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" disabled={disabled} data-empty={!value || undefined} className={cn("w-40 justify-start font-normal tabular-nums data-empty:text-muted-foreground", className)}>
                    <ClockIcon data-icon="inline-start" />
                    {value ?? placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto">
                <TimeColumns value={value} onChange={onChange} minuteStep={minuteStep} onMinutePicked={() => setOpen(false)} labels={labels} />
            </PopoverContent>
        </Popover>
    )
}

export { TimePicker, TimeColumns }
