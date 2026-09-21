import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from 'upay';

export const Closed = () => (
    <Select defaultValue="pix">
        <SelectTrigger className="w-56">
            <SelectValue placeholder="Forma de pagamento" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="pix">Pix</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
        </SelectContent>
    </Select>
);

export const Placeholder = () => (
    <Select>
        <SelectTrigger className="w-56">
            <SelectValue placeholder="Selecione o cliente" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="1">Maria Souza</SelectItem>
        </SelectContent>
    </Select>
);

export const OpenList = () => (
    <div className="h-52 w-56">
        <Select open defaultValue="boleto">
            <SelectTrigger className="w-56">
                <SelectValue placeholder="Forma de pagamento" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Forma de pagamento</SelectLabel>
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cartao">Cartão de crédito</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    </div>
);
