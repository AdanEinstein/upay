import { AppHeader, TooltipProvider } from 'upay';

export const WithBreadcrumbs = () => (
    <TooltipProvider>
        <AppHeader
            breadcrumbs={[
                { title: 'Painel', href: '/loja-exemplo/dashboard' },
                { title: 'Produtos', href: '/loja-exemplo/produtos' },
            ]}
        />
    </TooltipProvider>
);
