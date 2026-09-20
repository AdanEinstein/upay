import { Label, PasswordInput } from 'upay';

export const Default = () => (
    <div className="grid w-72 gap-1.5">
        <Label htmlFor="pw1">Senha</Label>
        <PasswordInput id="pw1" placeholder="Digite sua senha" />
    </div>
);

export const Filled = () => (
    <div className="grid w-72 gap-1.5">
        <Label htmlFor="pw2">Nova senha</Label>
        <PasswordInput id="pw2" defaultValue="segredo-forte-123" />
    </div>
);
