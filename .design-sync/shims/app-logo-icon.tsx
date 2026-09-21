// Igual a resources/js/components/app-logo-icon.tsx, mas com a máscara embutida (data URI).
// No app a imagem vem de /logo-mark.png (public/); dentro de um projeto do Claude Design esse caminho absoluto não resolve.
import type { HTMLAttributes } from 'react';

import logoMark from '../../public/logo-mark.png';

const mask = `url('${logoMark}') center / contain no-repeat`;

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
