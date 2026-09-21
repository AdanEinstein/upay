import { usePage } from '@inertiajs/react';
import { WifiSlashIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import BottomNav from '@/components/shop/bottom-nav';
import type { NavTab } from '@/components/shop/bottom-nav';
import InstallPrompt from '@/components/install-prompt';
import MobileScreen from '@/components/mobile-screen';
import { useOnline } from '@/hooks/use-online';

// Pages that show the bottom bar, and which tab they highlight. Detail and
// form pages are absent on purpose: they get a back button instead.
const NAV: Record<string, NavTab> = {
    home: 'home',
    'sales/index': 'sales',
    receivables: 'sales',
    'customers/index': 'customers',
    'products/index': 'products',
    finance: 'home',
    more: 'home',
    'catalog/show': 'home',
};

export default function ShopLayout({ children }: { children: ReactNode }) {
    const { t } = useTranslation('shop');
    const { component } = usePage();
    const online = useOnline();
    const showNav = component in NAV;

    return (
        <MobileScreen className={showNav ? 'pb-[100px]' : 'pb-6'}>
            {!online && (
                <div className="bg-muted text-muted-foreground flex items-center gap-2 px-5 py-2 text-[12.5px] font-medium">
                    <WifiSlashIcon className="size-[15px]" />
                    {t('common.offline')}
                </div>
            )}
            {children}
            {showNav && <BottomNav active={NAV[component]} />}
            <InstallPrompt />
        </MobileScreen>
    );
}
