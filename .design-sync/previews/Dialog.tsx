import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label } from 'upay';

export const ConfirmDelete = () => (
    <Dialog open>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Excluir cliente?</DialogTitle>
                <DialogDescription>
                    Essa ação remove Maria Souza e todas as vendas associadas. Não é possível desfazer.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline">Cancelar</Button>
                <Button variant="destructive">Excluir</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

export const WithForm = () => (
    <Dialog open>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Novo produto</DialogTitle>
                <DialogDescription>Informe os dados básicos do produto.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
                <div className="grid gap-1.5">
                    <Label htmlFor="produto-nome">Nome</Label>
                    <Input id="produto-nome" placeholder="Ex.: Notebook 14 polegadas" />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="produto-preco">Preço</Label>
                    <Input id="produto-preco" defaultValue="R$ 3.499,00" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline">Cancelar</Button>
                <Button>Salvar produto</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);
