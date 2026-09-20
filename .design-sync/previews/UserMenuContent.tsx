import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, UserMenuContent } from 'upay';

const user = { id: 1, name: 'Maria Souza', email: 'maria.souza@lojaexemplo.com.br', email_verified_at: null, created_at: '', updated_at: '' };

export const Open = () => (
    <div className="h-72 w-72">
        <DropdownMenu open>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">Maria Souza</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                <UserMenuContent user={user} />
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
);
