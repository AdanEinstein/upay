<?php

namespace Database\Factories;

use App\Enums\SaleStatus;
use App\Models\Customer;
use App\Models\Organization;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sale>
 */
class SaleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'customer_id' => fn (array $attributes) => Customer::factory()->create(['organization_id' => $attributes['organization_id']])->id,
            'total_cents' => fake()->numberBetween(1000, 50000),
            'status' => SaleStatus::Completed,
            'sold_at' => now(),
        ];
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => ['status' => SaleStatus::Cancelled]);
    }

    public function counter(): static
    {
        return $this->state(fn (array $attributes) => ['customer_id' => null]);
    }
}
