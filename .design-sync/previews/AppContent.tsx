import { AppContent } from 'upay';

export const HeaderVariant = () => (
    <AppContent variant="header" className="rounded-2xl border p-6">
        <h2 className="font-heading text-lg font-medium">Vendas do mês</h2>
        <p className="text-muted-foreground text-sm">42 vendas · R$ 18.450,00 em parcelas a receber.</p>
    </AppContent>
);
