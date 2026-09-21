import {
    Button,
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from 'upay';

export const Open = () => (
    <Collapsible open className="w-72 space-y-2">
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Histórico de pagamentos</span>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                    Ocultar
                </Button>
            </CollapsibleTrigger>
        </div>
        <div className="rounded-lg border px-3 py-2 text-sm">
            10/08/2026 · R$ 1.166,33
        </div>
        <CollapsibleContent className="space-y-2">
            <div className="rounded-lg border px-3 py-2 text-sm">
                10/07/2026 · R$ 1.166,33
            </div>
            <div className="rounded-lg border px-3 py-2 text-sm">
                10/06/2026 · R$ 1.166,34
            </div>
        </CollapsibleContent>
    </Collapsible>
);

export const Closed = () => (
    <Collapsible className="w-72 space-y-2">
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Histórico de pagamentos</span>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                    Mostrar
                </Button>
            </CollapsibleTrigger>
        </div>
        <CollapsibleContent>Oculto</CollapsibleContent>
    </Collapsible>
);
