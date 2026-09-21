import type { ReactNode } from 'react';

export default function ScreenTitle({
    children,
    action,
}: {
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
            <h1 className="font-heading text-xl font-bold lg:text-2xl">{children}</h1>
            {action}
        </div>
    );
}
