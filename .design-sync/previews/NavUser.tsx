import { NavUser, Sidebar, SidebarFooter, SidebarProvider, TooltipProvider } from 'upay';

export const Footer = () => (
    <TooltipProvider>
        <SidebarProvider className="min-h-0 h-40">
            <Sidebar collapsible="none" className="border-r">
                <SidebarFooter className="mt-auto">
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        </SidebarProvider>
    </TooltipProvider>
);
