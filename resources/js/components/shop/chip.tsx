import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Chip({
    active,
    className,
    ...props
}: ComponentProps<'button'> & { active?: boolean }) {
    return (
        <button
            type="button"
            aria-pressed={active}
            className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors',
                active
                    ? 'bg-brand text-brand-foreground'
                    : 'bg-muted text-muted-foreground',
                className,
            )}
            {...props}
        />
    );
}

export function ChipRow({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            className={cn('flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]', className)}
            {...props}
        />
    );
}
