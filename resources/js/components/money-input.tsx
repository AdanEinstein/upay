import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/money';

// Cash-register style mask: every typed digit shifts in from the cents.
export default function MoneyInput({
    cents,
    onCentsChange,
    ...props
}: Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
    cents: number | null;
    onCentsChange: (cents: number | null) => void;
}) {
    const { i18n } = useTranslation();

    return (
        <Input
            inputMode="numeric"
            value={
                cents === null ? '' : formatMoney(cents, i18n.resolvedLanguage)
            }
            onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '');

                onCentsChange(digits === '' ? null : Number(digits));
            }}
            {...props}
        />
    );
}
