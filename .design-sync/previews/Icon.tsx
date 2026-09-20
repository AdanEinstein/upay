import { Icon } from 'upay';
import { Users, Package, ShoppingCart } from 'lucide-react';

export const Icons = () => (
    <div className="flex items-center gap-4">
        <Icon iconNode={Users} className="size-5" />
        <Icon iconNode={Package} className="size-5" />
        <Icon iconNode={ShoppingCart} className="text-muted-foreground size-6" />
    </div>
);
