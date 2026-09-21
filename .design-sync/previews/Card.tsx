import {
    Button,
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Badge,
} from 'upay';

export const Summary = () => (
    <Card className="w-96">
        <CardHeader>
            <CardTitle>Parcelas do mês</CardTitle>
            <CardDescription>
                Resumo das cobranças com vencimento em setembro.
            </CardDescription>
            <CardAction>
                <Badge variant="secondary">12 abertas</Badge>
            </CardAction>
        </CardHeader>
        <CardContent>
            <p className="text-3xl font-semibold">R$ 18.450,00</p>
            <p className="text-muted-foreground mt-1 text-sm">
                R$ 6.200,00 já recebidos
            </p>
        </CardContent>
        <CardFooter className="gap-2">
            <Button size="sm">Ver parcelas</Button>
            <Button size="sm" variant="outline">
                Exportar
            </Button>
        </CardFooter>
    </Card>
);

export const Compact = () => (
    <Card size="sm" className="w-72">
        <CardHeader>
            <CardTitle>Maria Souza</CardTitle>
            <CardDescription>Cliente desde 2024</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
            3 vendas · 1 parcela em atraso
        </CardContent>
    </Card>
);
