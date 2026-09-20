import { Button } from 'upay';
import { PlusIcon, ArrowRightIcon, TrashIcon } from '@phosphor-icons/react';

export const Variants = () => (
    <div className="flex flex-wrap items-center gap-3">
        <Button>Registrar venda</Button>
        <Button variant="secondary">Cancelar</Button>
        <Button variant="outline">Exportar</Button>
        <Button variant="ghost">Ver detalhes</Button>
        <Button variant="destructive">Excluir cliente</Button>
        <Button variant="link">Esqueci minha senha</Button>
    </div>
);

export const Sizes = () => (
    <div className="flex flex-wrap items-center gap-3">
        <Button size="xs">Extra pequeno</Button>
        <Button size="sm">Pequeno</Button>
        <Button>Padrão</Button>
        <Button size="lg">Grande</Button>
    </div>
);

export const WithIcons = () => (
    <div className="flex flex-wrap items-center gap-3">
        <Button>
            <PlusIcon data-icon="inline-start" /> Novo cliente
        </Button>
        <Button variant="outline">
            Próxima parcela <ArrowRightIcon data-icon="inline-end" />
        </Button>
        <Button size="icon" variant="destructive" aria-label="Excluir">
            <TrashIcon />
        </Button>
    </div>
);

export const Disabled = () => (
    <div className="flex flex-wrap items-center gap-3">
        <Button disabled>Salvando…</Button>
        <Button variant="outline" disabled>
            Indisponível
        </Button>
    </div>
);
