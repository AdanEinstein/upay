import { UserInfo } from 'upay';

const user = { id: 1, name: 'Maria Souza', email: 'maria.souza@lojaexemplo.com.br', email_verified_at: null, created_at: '', updated_at: '' };

export const WithEmail = () => (
    <div className="flex w-72 items-center gap-2">
        <UserInfo user={user} showEmail />
    </div>
);

export const NameOnly = () => (
    <div className="flex w-72 items-center gap-2">
        <UserInfo user={user} />
    </div>
);
