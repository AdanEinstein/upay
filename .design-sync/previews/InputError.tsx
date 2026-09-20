import { InputError, Input, Label } from 'upay';

export const Message = () => (
    <div className="grid w-72 gap-1.5">
        <Label htmlFor="ie-email">E-mail</Label>
        <Input id="ie-email" defaultValue="maria.souza@" aria-invalid />
        <InputError message="Informe um e-mail válido." />
    </div>
);
