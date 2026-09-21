import {
    NavMain,
    Sidebar,
    SidebarContent,
    SidebarProvider,
    TooltipProvider,
} from 'upay';
import { LayoutGrid, Package, ShoppingCart, Users } from 'lucide-react';

export const Items = () => (
    <TooltipProvider>
        <SidebarProvider className="h-64 min-h-0">
            <Sidebar collapsible="none" className="border-r">
                <SidebarContent>
                    <NavMain
                        items={[
                            {
                                title: 'Painel',
                                href: '/loja-exemplo/dashboard',
                                icon: LayoutGrid,
                            },
                            {
                                title: 'Clientes',
                                href: '/loja-exemplo/clientes',
                                icon: Users,
                            },
                            {
                                title: 'Produtos',
                                href: '/loja-exemplo/produtos',
                                icon: Package,
                            },
                            {
                                title: 'Vendas',
                                href: '/loja-exemplo/vendas',
                                icon: ShoppingCart,
                            },
                        ]}
                    />
                </SidebarContent>
            </Sidebar>
        </SidebarProvider>
    </TooltipProvider>
);
