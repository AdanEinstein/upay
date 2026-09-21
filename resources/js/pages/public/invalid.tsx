import { Head } from '@inertiajs/react';
import { LinkBreakIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/shop/empty-state';
import MobileScreen from '@/components/mobile-screen';

export default function Invalid() {
    const { t } = useTranslation('public');

    return (
        <>
            <Head title={t('invalidTitle')}>
                <meta name="robots" content="noindex" />
            </Head>

            <MobileScreen>
                <EmptyState
                    icon={<LinkBreakIcon />}
                    title={t('invalidTitle')}
                    description={t('invalidDescription')}
                />
            </MobileScreen>
        </>
    );
}
