import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuSkeleton, SidebarProvider } from 'upay';

export const Loading = () => (
    <SidebarProvider className="min-h-0 h-48">
        <Sidebar collapsible="none" className="border-r">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        {[0, 1, 2, 3].map((i) => (
                            <SidebarMenuItem key={i}><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    </SidebarProvider>
);
