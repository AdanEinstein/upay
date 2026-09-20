import { ToggleGroup, ToggleGroupItem } from 'upay';

export const Period = () => (
    <ToggleGroup type="single" variant="outline" defaultValue="mes">
        <ToggleGroupItem value="semana">Semana</ToggleGroupItem>
        <ToggleGroupItem value="mes">Mês</ToggleGroupItem>
        <ToggleGroupItem value="ano">Ano</ToggleGroupItem>
    </ToggleGroup>
);

export const Multiple = () => (
    <ToggleGroup type="multiple" defaultValue={['pix', 'boleto']}>
        <ToggleGroupItem value="pix">Pix</ToggleGroupItem>
        <ToggleGroupItem value="boleto">Boleto</ToggleGroupItem>
        <ToggleGroupItem value="cartao">Cartão</ToggleGroupItem>
    </ToggleGroup>
);
