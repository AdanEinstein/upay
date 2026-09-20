import { Skeleton } from 'upay';

export const CardLoading = () => (
    <div className="flex w-72 items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    </div>
);
