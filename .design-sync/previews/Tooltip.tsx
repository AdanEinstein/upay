import {
    Button,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from 'upay';

export const Open = () => (
    <TooltipProvider>
        <div className="flex h-24 items-end justify-center pb-2">
            <Tooltip open>
                <TooltipTrigger asChild>
                    <Button variant="outline">Segunda via</Button>
                </TooltipTrigger>
                <TooltipContent>
                    Gera um novo boleto para esta parcela
                </TooltipContent>
            </Tooltip>
        </div>
    </TooltipProvider>
);
