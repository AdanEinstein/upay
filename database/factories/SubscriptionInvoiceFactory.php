<?php

namespace Database\Factories;

use App\Enums\BillingCycle;
use App\Enums\InvoiceStatus;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SubscriptionInvoice>
 */
class SubscriptionInvoiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subscription_id' => Subscription::factory(),
            'organization_id' => fn (array $attributes) => Subscription::query()->whereKey($attributes['subscription_id'])->value('organization_id'),
            'cycle' => BillingCycle::Monthly,
            'amount_cents' => 2990,
            'due_date' => now()->addDays(5)->toDateString(),
            'status' => InvoiceStatus::Open,
        ];
    }

    public function claimed(): static
    {
        return $this->state(fn () => ['status' => InvoiceStatus::Claimed, 'claimed_at' => now()]);
    }

    public function paid(): static
    {
        return $this->state(fn () => ['status' => InvoiceStatus::Paid, 'paid_at' => now()]);
    }
}
