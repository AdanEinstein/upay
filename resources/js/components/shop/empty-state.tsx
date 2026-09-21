import type { ReactNode } from 'react';

export default function EmptyState({
    icon,
    title,
    description,
    children,
}: {
    icon: ReactNode;
    title: string;
    description?: string;
    children?: ReactNode;
}) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16 text-center">
            <div className="bg-brand-soft text-brand flex size-[72px] items-center justify-center rounded-full [&_svg]:size-7">
                {icon}
            </div>
            <h2 className="font-heading text-[19px] font-bold">{title}</h2>
            {description && (
                <p className="text-muted-foreground max-w-[270px] text-sm leading-relaxed">
                    {description}
                </p>
            )}
            {children}
        </div>
    );
}
