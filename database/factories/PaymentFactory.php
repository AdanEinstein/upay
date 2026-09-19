<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Models\Installment;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
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
            'method' => PaymentMethod::Pix,
            'paid_at' => now(),
        ];
    }
}
