import {
    Badge,
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from 'upay';

export const Installments = () => (
    <Table className="w-[36rem]">
        <TableCaption>Parcelas da venda #1024</TableCaption>
        <TableHeader>
            <TableRow>
                <TableHead>Parcela</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Valor</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            <TableRow>
                <TableCell className="font-medium">1/3</TableCell>
                <TableCell>10/08/2026</TableCell>
                <TableCell>
                    <Badge>Paga</Badge>
                </TableCell>
                <TableCell className="text-right">R$ 1.166,33</TableCell>
            </TableRow>
            <TableRow>
                <TableCell className="font-medium">2/3</TableCell>
                <TableCell>10/09/2026</TableCell>
                <TableCell>
                    <Badge variant="destructive">Atrasada</Badge>
                </TableCell>
                <TableCell className="text-right">R$ 1.166,33</TableCell>
            </TableRow>
            <TableRow>
                <TableCell className="font-medium">3/3</TableCell>
                <TableCell>10/10/2026</TableCell>
                <TableCell>
                    <Badge variant="secondary">Em aberto</Badge>
                </TableCell>
                <TableCell className="text-right">R$ 1.166,34</TableCell>
            </TableRow>
        </TableBody>
        <TableFooter>
            <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">R$ 3.499,00</TableCell>
            </TableRow>
        </TableFooter>
    </Table>
);
