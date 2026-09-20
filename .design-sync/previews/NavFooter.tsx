import { NavFooter, Sidebar, SidebarFooter, SidebarProvider, TooltipProvider } from 'upay';
import { BookOpen, LifeBuoy } from 'lucide-react';

export const Links = () => (
    <TooltipProvider>
    <SidebarProvider className="min-h-0 h-40">
        <Sidebar collapsible="none" className="border-r">
            <SidebarFooter className="mt-auto">
                <NavFooter
                    items={[
                        { title: 'Central de ajuda', href: 'https://ajuda.upay.com.br', icon: LifeBuoy },
                        { title: 'Documentação', href: 'https://docs.upay.com.br', icon: BookOpen },
                    ]}
                />
            </SidebarFooter>
        </Sidebar>
    </SidebarProvider>
    </TooltipProvider>
);
