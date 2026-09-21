import { Alert, AlertDescription, AlertTitle } from 'upay';
import { InfoIcon, WarningCircleIcon } from '@phosphor-icons/react';

export const Default = () => (
    <div className="w-[28rem]">
        <Alert>
            <InfoIcon />
            <AlertTitle>Parcelas atualizadas</AlertTitle>
            <AlertDescription>
                As 6 parcelas da venda #1024 foram recalculadas com a nova taxa
                de juros.
            </AlertDescription>
        </Alert>
    </div>
);

export const Destructive = () => (
    <div className="w-[28rem]">
        <Alert variant="destructive">
            <WarningCircleIcon />
            <AlertTitle>Não foi possível registrar o pagamento</AlertTitle>
            <AlertDescription>
                Verifique o valor informado e tente novamente.
            </AlertDescription>
        </Alert>
    </div>
);
