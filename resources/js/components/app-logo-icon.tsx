import type { HTMLAttributes } from 'react';

const mask = "url('/logo-mark.png') center / contain no-repeat";

export default function AppLogoIcon({
    className = '',
    style,
    ...props
}: HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            {...props}
            aria-hidden="true"
            className={`inline-block aspect-square bg-current ${className}`}
            style={{ mask, WebkitMask: mask, ...style }}
        />
    );
}
