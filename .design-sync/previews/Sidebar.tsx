import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from 'upay';
import { HouseIcon, UsersIcon, PackageIcon, ShoppingCartIcon, GearIcon } from '@phosphor-icons/react';

export const Navigation = () => (
    <SidebarProvider className="min-h-0 h-[23rem]">
        <Sidebar collapsible="none" className="border-r">
            <SidebarHeader className="px-4 py-3 text-base font-semibold">Upay</SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Operação</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem><SidebarMenuButton isActive><HouseIcon /> Painel</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton><UsersIcon /> Clientes</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuButton><PackageIcon /> Produtos</SidebarMenuButton></SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton><ShoppingCartIcon /> Vendas</SidebarMenuButton>
                            <SidebarMenuBadge>12</SidebarMenuBadge>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem><SidebarMenuButton><GearIcon /> Configurações</SidebarMenuButton></SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    </SidebarProvider>
);
