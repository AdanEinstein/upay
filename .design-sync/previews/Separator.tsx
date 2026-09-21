import { Separator } from 'upay';

export const Horizontal = () => (
    <div className="w-72">
        <p className="text-sm font-medium">Resumo da venda</p>
        <p className="text-muted-foreground text-sm">
            Venda #1024 · 6 parcelas
        </p>
        <Separator className="my-3" />
        <p className="text-sm">Total: R$ 3.499,00</p>
    </div>
);

export const Vertical = () => (
    <div className="flex h-5 items-center gap-3 text-sm">
        <span>Clientes</span>
        <Separator orientation="vertical" />
        <span>Produtos</span>
        <Separator orientation="vertical" />
        <span>Vendas</span>
    </div>
);
