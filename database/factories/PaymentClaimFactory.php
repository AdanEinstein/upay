<?php

namespace Database\Factories;

use App\Enums\ClaimStatus;
use App\Models\Installment;
use App\Models\PaymentClaim;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentClaim>
 */
class PaymentClaimFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'installment_id' => Installment::factory(),
            'organization_id' => fn (array $attributes) => Installment::withoutTenant()->whereKey($attributes['installment_id'])->value('organization_id'),
            'amount_cents' => fake()->numberBetween(1000, 20000),
            'status' => ClaimStatus::Pending,
        ];
    }
}
