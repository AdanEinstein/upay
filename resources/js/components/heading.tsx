import { cn } from '@/lib/utils';

export default function Heading({
    title,
    description,
    variant = 'default',
    hideTitleOnMobile = false,
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
    // The mobile PageHeader already shows the same title.
    hideTitleOnMobile?: boolean;
}) {
    return (
        <header className={variant === 'small' ? '' : 'mb-8 space-y-0.5'}>
            <h2
                className={cn(
                    variant === 'small'
                        ? 'mb-0.5 text-base font-medium'
                        : 'text-xl font-semibold tracking-tight',
                    hideTitleOnMobile && 'max-lg:sr-only',
                )}
            >
                {title}
            </h2>
            {description && (
                <p className="text-muted-foreground text-sm">{description}</p>
            )}
        </header>
    );
}
