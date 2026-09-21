import { Checkbox, Label } from 'upay';

export const States = () => (
    <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
            <Checkbox id="c1" />
            <Label htmlFor="c1">Enviar comprovante por e-mail</Label>
        </div>
        <div className="flex items-center gap-2">
            <Checkbox id="c2" defaultChecked />
            <Label htmlFor="c2">Lembrar vencimentos</Label>
        </div>
        <div className="flex items-center gap-2">
            <Checkbox id="c3" disabled />
            <Label htmlFor="c3">Cobrança automática (indisponível)</Label>
        </div>
        <div className="flex items-center gap-2">
            <Checkbox id="c4" defaultChecked disabled />
            <Label htmlFor="c4">Termos aceitos</Label>
        </div>
    </div>
);
