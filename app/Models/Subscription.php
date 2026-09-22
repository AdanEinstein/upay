<?php

namespace App\Models;

use App\Enums\BillingCycle;
use App\Enums\SubscriptionStatus;
use Database\Factories\SubscriptionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $organization_id
 * @property int $plan_id
 * @property SubscriptionStatus $status
 * @property int $price_cents
 * @property BillingCycle $billing_cycle
 * @property Carbon|null $current_period_end
 * @property Carbon|null $canceled_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['plan_id', 'status', 'price_cents', 'billing_cycle', 'current_period_end', 'canceled_at'])]
class Subscription extends Model
{
    /** @use HasFactory<SubscriptionFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'billing_cycle' => BillingCycle::class,
            'current_period_end' => 'datetime',
            'canceled_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * @return BelongsTo<Organization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * @return HasMany<SubscriptionInvoice, $this>
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(SubscriptionInvoice::class);
    }

    /**
     * Amount charged per billing cycle. price_cents stays the monthly price (MRR base).
     */
    public function cycleAmountCents(): int
    {
        return match ($this->billing_cycle) {
            BillingCycle::Monthly => $this->price_cents,
            BillingCycle::Annual => $this->plan->annual_price_cents ?? $this->price_cents * 12,
        };
    }
}
