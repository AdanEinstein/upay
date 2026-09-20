import { PlaceholderPattern } from 'upay';

export const Panel = () => (
    <div className="border-border relative h-32 w-72 overflow-hidden rounded-xl border">
        <PlaceholderPattern className="stroke-foreground/20 absolute inset-0 size-full" />
    </div>
);
