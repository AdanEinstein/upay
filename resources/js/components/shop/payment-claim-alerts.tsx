import { router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useFormat } from '@/hooks/use-format';
import { show } from '@/routes/sales';

type PaymentClaimPayload = {
    claimId: number;
    saleId: number;
    customer: string;
    amountCents: number;
    hasReceipt: boolean;
};

// Listens on the store's private channel; renders nothing. Must only be mounted
// when Echo is configured and a tenant is active (see AppLayout).
export default function PaymentClaimAlerts({ organizationId }: { organizationId: number }) {
    const { t } = useTranslation('shop');
    const { money } = useFormat();

    useEcho<PaymentClaimPayload>(`organization.${organizationId}`, '.payment-claim.created', (event) => {
        toast(t('claimAlert.title', { customer: event.customer }), {
            // Same id updates the toast in place, so a repeated delivery never stacks a second one.
            id: `payment-claim-${event.claimId}`,
            description: money(event.amountCents),
            action: {
                label: t('claimAlert.view'),
                onClick: () => router.visit(show.url({ sale: event.saleId })),
            },
        });

        router.reload({
            only: ['pendingClaims', 'pendingClaimsCount', 'sale'],
        });
    });

    return null;
}
