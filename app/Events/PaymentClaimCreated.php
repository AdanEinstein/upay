<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Tells every user of a store that a customer sent a "já paguei" notice.
 * Carries plain values only, so the queue worker never needs a tenant context.
 */
class PaymentClaimCreated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $organizationId,
        public int $claimId,
        public int $saleId,
        public string $customerName,
        public int $amountCents,
        public bool $hasReceipt,
    ) {}

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('organization.'.$this->organizationId)];
    }

    public function broadcastAs(): string
    {
        return 'payment-claim.created';
    }

    /**
     * @return array<string, int|string|bool>
     */
    public function broadcastWith(): array
    {
        return [
            'claimId' => $this->claimId,
            'saleId' => $this->saleId,
            'customer' => $this->customerName,
            'amountCents' => $this->amountCents,
            'hasReceipt' => $this->hasReceipt,
        ];
    }
}
