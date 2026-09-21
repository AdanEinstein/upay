import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from 'upay';

export const Open = () => (
    <div className="h-64 w-64">
        <DropdownMenu open>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">Ações da venda</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Venda #1024</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    Registrar pagamento
                    <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>Gerar segunda via</DropdownMenuItem>
                <DropdownMenuItem>Editar parcelas</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                    Cancelar venda
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
);
