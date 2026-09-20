import { Input, Label } from 'upay';

export const Default = () => (
    <div className="grid w-72 gap-1.5">
        <Label htmlFor="i-email">E-mail</Label>
        <Input id="i-email" type="email" placeholder="cliente@exemplo.com.br" />
    </div>
);

export const Filled = () => (
    <div className="grid w-72 gap-1.5">
        <Label htmlFor="i-nome">Nome do cliente</Label>
        <Input id="i-nome" defaultValue="Maria Souza" />
    </div>
);

export const Invalid = () => (
    <div className="grid w-72 gap-1.5">
        <Label htmlFor="i-cpf">CPF</Label>
        <Input id="i-cpf" defaultValue="123.456" aria-invalid />
        <p className="text-destructive text-sm">CPF incompleto.</p>
    </div>
);

export const Disabled = () => (
    <div className="grid w-72 gap-1.5">
        <Label htmlFor="i-id">Código</Label>
        <Input id="i-id" defaultValue="CLI-0042" disabled />
    </div>
);
