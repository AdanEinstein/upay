import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { brandScope } from '@/components/mobile-screen';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div
            className={cn(
                'bg-background flex min-h-svh flex-col items-center p-6 md:justify-center md:p-10',
                brandScope,
            )}
        >
            <div className="flex w-full max-w-sm flex-col gap-6">
                <Link href={home()} className="w-fit" aria-label={name}>
                    <AppLogoIcon className="text-brand size-10" />
                </Link>

                {title && (
                    <div className="space-y-1">
                        <h1 className="font-heading text-[22px] font-bold">
                            {title}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {description}
                        </p>
                    </div>
                )}

                {children}
            </div>
        </div>
    );
}
