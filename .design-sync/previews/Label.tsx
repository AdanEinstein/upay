import { Input, Label } from 'upay';

export const WithField = () => (
    <div className="grid w-64 gap-1.5">
        <Label htmlFor="l-tel">Telefone</Label>
        <Input id="l-tel" placeholder="(11) 99999-0000" />
    </div>
);
