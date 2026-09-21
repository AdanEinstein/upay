import { ManagePasskeys } from 'upay';

export const WithPasskeys = () => (
    <div className="w-[36rem]">
        <ManagePasskeys
            canManagePasskeys
            passkeys={[
                {
                    id: 1,
                    name: 'MacBook da Maria',
                    authenticator: 'Touch ID',
                    created_at_diff: 'há 2 meses',
                    last_used_at_diff: 'há 3 dias',
                },
                {
                    id: 2,
                    name: 'iPhone',
                    authenticator: 'Face ID',
                    created_at_diff: 'há 1 semana',
                    last_used_at_diff: null,
                },
            ]}
        />
    </div>
);

export const Empty = () => (
    <div className="w-[36rem]">
        <ManagePasskeys canManagePasskeys passkeys={[]} />
    </div>
);
