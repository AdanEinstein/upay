import { ArrowSquareOutIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { brandScope } from '@/components/mobile-screen';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const clamp = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

// Image zoom scales the <img> width inside a scrollable box, so panning is plain scrolling.
// PDFs use the browser's own viewer, which already zooms.
export default function ReceiptViewer({
    url,
    type,
    open,
    onOpenChange,
}: {
    url: string;
    type: 'image' | 'pdf';
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useTranslation('shop');
    const [zoom, setZoom] = useState(1);
    const pointers = useRef(new Map<number, { x: number; y: number }>());
    const pinchDistance = useRef<number | null>(null);

    function handleOpenChange(next: boolean) {
        if (!next) {
            setZoom(1);
        }

        onOpenChange(next);
    }

    function trackPointer(event: PointerEvent<HTMLDivElement>) {
        if (!pointers.current.has(event.pointerId)) {
            return;
        }

        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (pointers.current.size !== 2) {
            return;
        }

        const [a, b] = [...pointers.current.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);

        if (pinchDistance.current) {
            setZoom((current) => clamp(current * (distance / pinchDistance.current!)));
        }

        pinchDistance.current = distance;
    }

    function releasePointer(event: PointerEvent<HTMLDivElement>) {
        pointers.current.delete(event.pointerId);
        pinchDistance.current = null;
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className={cn(brandScope, 'flex max-h-[92svh] flex-col gap-3 p-4 sm:max-w-3xl')}>
                <DialogTitle className="pr-10 text-[15px] font-bold">{t('sale.receipt.title')}</DialogTitle>
                <DialogDescription className="sr-only">{t('sale.receipt.description')}</DialogDescription>

                {type === 'image' ? (
                    <div
                        className="bg-muted h-[65svh] touch-pan-x touch-pan-y overflow-auto rounded-xl"
                        onPointerDown={(event) => pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })}
                        onPointerMove={trackPointer}
                        onPointerUp={releasePointer}
                        onPointerCancel={releasePointer}
                    >
                        <img
                            src={url}
                            alt={t('sale.receipt.title')}
                            draggable={false}
                            onDoubleClick={() => setZoom((current) => (current > 1 ? 1 : 2.5))}
                            style={{ width: `${zoom * 100}%` }}
                            className="mx-auto block max-w-none object-contain select-none"
                        />
                    </div>
                ) : (
                    <iframe src={url} title={t('sale.receipt.title')} className="bg-muted h-[65svh] w-full rounded-xl" />
                )}

                <div className="flex items-center justify-between gap-2">
                    {type === 'image' ? (
                        <div className="flex items-center gap-1.5">
                            <Button size="icon" variant="outline" aria-label={t('sale.receipt.zoomOut')} disabled={zoom <= MIN_ZOOM} onClick={() => setZoom((current) => clamp(current - 0.5))}>
                                <MagnifyingGlassMinusIcon />
                            </Button>
                            <Button variant="outline" className="min-w-16 tabular-nums" aria-label={t('sale.receipt.zoomReset')} onClick={() => setZoom(1)}>
                                {Math.round(zoom * 100)}%
                            </Button>
                            <Button size="icon" variant="outline" aria-label={t('sale.receipt.zoomIn')} disabled={zoom >= MAX_ZOOM} onClick={() => setZoom((current) => clamp(current + 0.5))}>
                                <MagnifyingGlassPlusIcon />
                            </Button>
                        </div>
                    ) : (
                        <span />
                    )}
                    <Button asChild variant="ghost" className="text-[13px]">
                        <a href={url} target="_blank" rel="noreferrer">
                            <ArrowSquareOutIcon />
                            {t('sale.receipt.openNewTab')}
                        </a>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
