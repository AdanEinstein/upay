import { Badge } from 'upay';

export const Variants = () => (
    <div className="flex flex-wrap items-center gap-2">
        <Badge>Paga</Badge>
        <Badge variant="secondary">Em aberto</Badge>
        <Badge variant="destructive">Atrasada</Badge>
        <Badge variant="outline">Rascunho</Badge>
        <Badge variant="ghost">Arquivada</Badge>
        <Badge variant="link">Ver mais</Badge>
    </div>
);
