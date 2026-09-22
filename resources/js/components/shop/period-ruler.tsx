import { cn } from '@/lib/utils';

// The billing period drawn as a ruler: length is time, the marker is today.
// Ticks are weeks for a monthly period and months for an annual one.
export default function PeriodRuler({
    periodDays,
    daysLeft,
    segments,
    tone,
    startLabel,
    endLabel,
}: {
    periodDays: number;
    daysLeft: number;
    segments: number;
    tone: 'brand' | 'destructive' | 'muted';
    startLabel: string;
    endLabel: string;
}) {
    const elapsed = Math.min(1, Math.max(0, 1 - daysLeft / periodDays));
    const fill = {
        brand: 'bg-brand',
        destructive: 'bg-destructive',
        muted: 'bg-muted-foreground/40',
    }[tone];

    return (
        <div className="mt-4">
            <div className="relative">
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                        className={cn(
                            'h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700',
                            fill,
                        )}
                        style={{ width: `${elapsed * 100}%` }}
                    />
                </div>
                <span
                    aria-hidden
                    className={cn(
                        'border-background absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2',
                        fill,
                    )}
                    style={{ left: `${elapsed * 100}%` }}
                />
                <div aria-hidden className="relative mt-1 h-1.5">
                    {Array.from({ length: segments + 1 }, (_, i) => (
                        <span
                            key={i}
                            className="bg-border absolute top-0 h-full w-px"
                            style={{ left: `${(i / segments) * 100}%` }}
                        />
                    ))}
                </div>
            </div>
            <div className="text-muted-foreground mt-1 flex justify-between text-[11.5px] tabular-nums">
                <span>{startLabel}</span>
                <span>{endLabel}</span>
            </div>
        </div>
    );
}
