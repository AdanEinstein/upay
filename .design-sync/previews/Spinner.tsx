import { Button, Spinner } from 'upay';

export const Sizes = () => (
    <div className="flex items-center gap-4">
        <Spinner />
        <Spinner className="size-6" />
        <Spinner className="size-8" />
    </div>
);

export const InButton = () => (
    <Button disabled>
        <Spinner /> Processando pagamento
    </Button>
);
