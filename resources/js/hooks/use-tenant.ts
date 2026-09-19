import { usePage } from '@inertiajs/react';

export type Tenant = {
    slug: string;
    name: string;
    logoUrl: string | null;
    accentColor: string;
    accentColorHover: string;
    accentColorSoft: string;
    onPrimaryColor: string;
};

export function useTenant(): Tenant | null {
    return usePage<{ tenant: Tenant | null }>().props.tenant;
}
