import type { ReactNode } from 'react';
import { brandScope } from '@/components/mobile-screen';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// Sheet content renders in a portal, outside <MobileScreen>, so it needs the
// tenant brand scope applied again for buttons and checkboxes inside.
export default function BottomSheet({
    open,
    onOpenChange,
    title,
    description,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className={cn(
                    brandScope,
                    'mx-auto max-w-md gap-0 rounded-t-3xl pb-[env(safe-area-inset-bottom)]',
                    // Desktop: centered modal instead of a bottom sheet.
                    'lg:data-[side=bottom]:inset-x-auto lg:data-[side=bottom]:top-1/2 lg:data-[side=bottom]:bottom-auto lg:data-[side=bottom]:left-1/2 lg:data-[side=bottom]:w-[440px] lg:data-[side=bottom]:-translate-x-1/2 lg:data-[side=bottom]:-translate-y-1/2 lg:data-[side=bottom]:rounded-2xl lg:data-[side=bottom]:border lg:pb-0',
                )}
            >
                <SheetHeader>
                    <SheetTitle className="font-heading text-[17px] font-bold">
                        {title}
                    </SheetTitle>
                    {description ? (
                        <SheetDescription>{description}</SheetDescription>
                    ) : (
                        <SheetDescription className="sr-only">{title}</SheetDescription>
                    )}
                </SheetHeader>
                <div className="flex flex-col gap-3.5 px-5 pb-5">{children}</div>
            </SheetContent>
        </Sheet>
    );
}
