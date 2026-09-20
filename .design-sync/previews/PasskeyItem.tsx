import { PasskeyItem } from 'upay';

export const Used = () => (
    <div className="w-[30rem]">
        <PasskeyItem
            passkey={{ id: 1, name: 'MacBook da Maria', authenticator: 'Touch ID', created_at_diff: 'há 2 meses', last_used_at_diff: 'há 3 dias' }}
            onDelete={() => {}}
        />
    </div>
);

export const NeverUsed = () => (
    <div className="w-[30rem]">
        <PasskeyItem
            passkey={{ id: 2, name: 'iPhone', authenticator: null, created_at_diff: 'há 1 dia', last_used_at_diff: null }}
            onDelete={() => {}}
        />
    </div>
);
