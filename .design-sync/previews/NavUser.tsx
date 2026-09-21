import {
    NavUser,
    Sidebar,
    SidebarFooter,
    SidebarProvider,
    TooltipProvider,
} from 'upay';

export const Footer = () => (
    <TooltipProvider>
        <SidebarProvider className="h-40 min-h-0">
            <Sidebar collapsible="none" className="border-r">
                <SidebarFooter className="mt-auto">
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        </SidebarProvider>
    </TooltipProvider>
);
