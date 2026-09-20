import { Button, Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from 'upay';

export const Right = () => (
    <Sheet open>
        <SheetContent>
            <SheetHeader>
                <SheetTitle>Detalhes do cliente</SheetTitle>
                <SheetDescription>Maria Souza · cliente desde 2024</SheetDescription>
            </SheetHeader>
            <div className="px-4 text-sm">3 vendas · 1 parcela em atraso</div>
            <SheetFooter>
                <Button>Registrar venda</Button>
                <Button variant="outline">Fechar</Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>
);

export const Bottom = () => (
    <Sheet open>
        <SheetContent side="bottom">
            <SheetHeader>
                <SheetTitle>Filtrar vendas</SheetTitle>
                <SheetDescription>Escolha o período e a situação das parcelas.</SheetDescription>
            </SheetHeader>
        </SheetContent>
    </Sheet>
);
