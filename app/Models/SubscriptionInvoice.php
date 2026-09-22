<?php

namespace App\Models;

use App\Enums\BillingCycle;
use App\Enums\InvoiceStatus;
use Database\Factories\SubscriptionInvoiceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A platform charge for one subscription period. Not tenant-scoped: the super admin reads it across organizations.
 *
 * @property int $id
 * @property int $organization_id
 * @property int $subscription_id
 * @property BillingCycle $cycle
 * @property int $amount_cents
 * @property Carbon $due_date
 * @property InvoiceStatus $status
 * @property Carbon|null $claimed_at
 * @property string|null $receipt_path
 * @property string|null $rejection_reason
 * @property Carbon|null $paid_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['organization_id', 'subscription_id', 'cycle', 'amount_cents', 'due_date', 'status', 'claimed_at', 'receipt_path', 'rejection_reason', 'paid_at'])]
class SubscriptionInvoice extends Model
{
    /** @use HasFactory<SubscriptionInvoiceFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'cycle' => BillingCycle::class,
            'status' => InvoiceStatus::class,
            'due_date' => 'date',
            'claimed_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Organization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * @return BelongsTo<Subscription, $this>
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /**
     * Still owed: not paid and not canceled.
     */
    public function isPayable(): bool
    {
        return in_array($this->status, [InvoiceStatus::Open, InvoiceStatus::Claimed], true);
    }
}
