import { AppContent, AppShell, AppSidebar, AppSidebarHeader, Card, CardContent, CardDescription, CardHeader, CardTitle, TooltipProvider } from 'upay';

export const Page = () => (
    <TooltipProvider>
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={[{ title: 'Painel', href: '/loja-exemplo/dashboard' }]} />
                <div className="grid gap-4 p-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Parcelas do mês</CardTitle>
                            <CardDescription>Vencimentos de setembro</CardDescription>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">R$ 18.450,00</CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Clientes em atraso</CardTitle>
                            <CardDescription>Com parcelas vencidas</CardDescription>
                        </CardHeader>
                        <CardContent className="text-2xl font-semibold">7</CardContent>
                    </Card>
                </div>
            </AppContent>
        </AppShell>
    </TooltipProvider>
);
