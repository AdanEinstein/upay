import { Link } from '@inertiajs/react';
import { DotsThreeCircleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { show as more } from '@/routes/more';

// Mobile-only shortcut to the "More" screen (settings, help, sign out); the
// desktop sidebar already links there.
export default function MoreButton() {
    const { t } = useTranslation('shop');

    return (
        <Button
            asChild
            variant="ghost"
            size="icon-sm"
            aria-label={t('more.title')}
            className="lg:hidden"
        >
            <Link href={more.url()}>
                <DotsThreeCircleIcon className="size-[22px]" />
            </Link>
        </Button>
    );
}
