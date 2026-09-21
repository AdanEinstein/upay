import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';
import { useTenant } from '@/hooks/use-tenant';

export default function AppLogo() {
    const { name } = usePage().props;
    const tenant = useTenant();

    return (
        <>
            {tenant?.logoUrl ? (
                <img
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    className="size-8 rounded-md object-contain"
                />
            ) : (
                <div className="bg-brand text-brand-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                    <AppLogoIcon className="size-5" />
                </div>
            )}
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {tenant?.name ?? name}
                </span>
            </div>
        </>
    );
}
