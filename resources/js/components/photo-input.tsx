import { CameraIcon, FileIcon, ImagesIcon } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import type { ComponentProps, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@/components/shop/bottom-sheet';
import { Button } from '@/components/ui/button';

type Source = 'camera' | 'gallery';

function isTouchDevice(): boolean {
    return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Drop-in `<input type="file">` for images. On touch devices, opening it asks
 * whether to take a photo or pick one from the gallery — Android's photo
 * picker doesn't offer the camera on its own. Desktop keeps the native dialog.
 */
export default function PhotoInput({
    accept = 'image/*',
    onClick,
    ...props
}: Omit<ComponentProps<'input'>, 'type'>) {
    const { t } = useTranslation('common');
    const input = useRef<HTMLInputElement>(null);
    const bypass = useRef(false);
    const [choosing, setChoosing] = useState(false);
    const imagesOnly = accept
        .split(',')
        .every((type) => type.trim().startsWith('image/'));

    function handleClick(event: MouseEvent<HTMLInputElement>) {
        onClick?.(event);

        if (bypass.current) {
            bypass.current = false;

            return;
        }

        if (!event.defaultPrevented && isTouchDevice()) {
            event.preventDefault();
            setChoosing(true);
        }
    }

    function open(source: Source) {
        const element = input.current;

        if (!element) {
            return;
        }

        if (source === 'camera') {
            element.setAttribute('capture', 'environment');
        } else {
            element.removeAttribute('capture');
        }

        setChoosing(false);
        bypass.current = true;
        element.click();
    }

    return (
        <>
            <input
                ref={input}
                type="file"
                accept={accept}
                onClick={handleClick}
                {...props}
            />
            <BottomSheet
                open={choosing}
                onOpenChange={setChoosing}
                title={t('photoSource.title')}
            >
                <Button
                    type="button"
                    size="lg"
                    className="h-12 w-full text-base"
                    onClick={() => open('camera')}
                >
                    <CameraIcon className="size-5" />
                    {t('photoSource.camera')}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-12 w-full text-base"
                    onClick={() => open('gallery')}
                >
                    {imagesOnly ? (
                        <ImagesIcon className="size-5" />
                    ) : (
                        <FileIcon className="size-5" />
                    )}
                    {imagesOnly
                        ? t('photoSource.gallery')
                        : t('photoSource.files')}
                </Button>
            </BottomSheet>
        </>
    );
}
