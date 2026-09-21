import { CameraIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export default function ProductImage({
    url,
    className,
    iconClassName,
}: {
    url: string | null;
    className?: string;
    iconClassName?: string;
}) {
    return (
        <div
            className={cn(
                'bg-muted text-muted-foreground flex items-center justify-center overflow-hidden',
                className,
            )}
        >
            {url ? (
                <img src={url} alt="" className="size-full object-cover" />
            ) : (
                <CameraIcon className={cn('size-[26px]', iconClassName)} />
            )}
        </div>
    );
}
