import { router } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController';
import Heading from '@/components/heading';
import PasskeyItem from '@/components/passkey-item';
import PasskeyRegistration from '@/components/passkey-register';
import type { Passkey } from '@/types/auth';

export type Props = {
    canManagePasskeys?: boolean;
    passkeys?: Passkey[];
};

const EmptyState = () => {
    const { t } = useTranslation('auth');

    return (
        <div className="p-8 text-center">
            <div className="bg-muted mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                <KeyRound className="text-muted-foreground h-7 w-7" />
            </div>
            <p className="font-medium">{t('passkey.empty')}</p>
            <p className="text-muted-foreground mt-1 text-sm">
                {t('passkey.emptyDescription')}
            </p>
        </div>
    );
};

export default function ManagePasskeys(props: Props) {
    const { t } = useTranslation('auth');
    const passkeys = props.passkeys ?? [];

    const handleDelete = (id: number, onError: () => void) => {
        router.delete(destroy.url({ passkey: id }), {
            preserveScroll: true,
            onError,
        });
    };

    const handleRegisterSuccess = () => {
        router.reload();
    };

    if (!(props.canManagePasskeys ?? false)) {
        return null;
    }

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title={t('passkey.manage.title')}
                description={t('passkey.manage.description')}
            />

            <div className="border-border overflow-hidden rounded-lg border">
                {passkeys.length > 0 ? (
                    passkeys.map((passkey) => (
                        <PasskeyItem
                            key={passkey.id}
                            passkey={passkey}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>

            <PasskeyRegistration onSuccess={handleRegisterSuccess} />
        </div>
    );
}
