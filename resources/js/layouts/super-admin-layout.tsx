import { Link, router } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { logout } from '@/routes/super-admin';
import { index as organizationsIndex } from '@/routes/super-admin/organizations';

export default function SuperAdminLayout({ children }: PropsWithChildren) {
    const { t } = useTranslation('common');

    return (
        <div className="bg-background min-h-svh">
            <header className="border-b">
                <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
                    <Link href={organizationsIndex()} className="font-semibold">
                        Super Admin
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.post(logout().url)}
                    >
                        {t('common:logOut')}
                    </Button>
                </div>
            </header>
            <main className="mx-auto max-w-5xl p-4">{children}</main>
        </div>
    );
}
