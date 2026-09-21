import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export default function Textarea({
    className,
    ...props
}: ComponentProps<'textarea'>) {
    return (
        <textarea
            className={cn(
                'border-input bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-16 w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none focus-visible:ring-[3px]',
                className,
            )}
            {...props}
        />
    );
}
