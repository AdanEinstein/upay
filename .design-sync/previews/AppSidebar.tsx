import { AppSidebar, SidebarProvider, TooltipProvider } from 'upay';

export const Default = () => (
    <TooltipProvider>
        <SidebarProvider>
            <AppSidebar />
        </SidebarProvider>
    </TooltipProvider>
);
