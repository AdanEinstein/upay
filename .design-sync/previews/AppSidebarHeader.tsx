import { AppSidebarHeader, SidebarProvider } from 'upay';

export const WithBreadcrumbs = () => (
    <SidebarProvider className="min-h-0">
        <div className="w-full">
            <AppSidebarHeader
                breadcrumbs={[
                    { title: 'Painel', href: '/loja-exemplo/dashboard' },
                    { title: 'Vendas', href: '/loja-exemplo/vendas' },
                ]}
            />
        </div>
    </SidebarProvider>
);
