import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger } from 'upay';

export const Filters = () => (
    <div className="h-64 w-80">
        <Popover open>
            <PopoverTrigger asChild>
                <Button variant="outline">Filtrar vendas</Button>
            </PopoverTrigger>
            <PopoverContent className="grid gap-3">
                <div className="grid gap-1.5">
                    <Label htmlFor="f-cliente">Cliente</Label>
                    <Input id="f-cliente" placeholder="Nome ou CPF" />
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm">Limpar</Button>
                    <Button size="sm">Aplicar</Button>
                </div>
            </PopoverContent>
        </Popover>
    </div>
);
