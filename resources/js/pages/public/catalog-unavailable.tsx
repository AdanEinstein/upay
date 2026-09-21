import { Head } from '@inertiajs/react';
import { StorefrontIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import MobileScreen from '@/components/mobile-screen';
import EmptyState from '@/components/shop/empty-state';

export default function CatalogUnavailable() {
    const { t } = useTranslation('public');

    return (
        <>
            <Head title={t('unavailableTitle')}>
                <meta name="robots" content="noindex" />
            </Head>

            <MobileScreen>
                <EmptyState
                    icon={<StorefrontIcon />}
                    title={t('unavailableTitle')}
                    description={t('unavailableDescription')}
                />
            </MobileScreen>
        </>
    );
}
