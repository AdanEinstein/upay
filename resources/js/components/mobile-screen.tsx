import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

// Points shadcn's `primary` at the tenant brand color, so Button/Checkbox/focus
// rings inside pick up the store's accent without per-component overrides.
export const brandScope =
    '[--primary:var(--tenant-primary)] [--primary-foreground:var(--tenant-on-primary)] [--ring:var(--tenant-primary)]';

export default function MobileScreen({
    className,
    ...props
}: ComponentProps<'div'>) {
    return (
        <div
            className={cn(
                'bg-background mx-auto flex min-h-svh w-full max-w-md flex-col',
                brandScope,
                className,
            )}
            {...props}
        />
    );
}
