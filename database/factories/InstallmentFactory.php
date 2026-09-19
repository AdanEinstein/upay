<?php

namespace Database\Factories;

use App\Models\Installment;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Installment>
 */
class InstallmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sale_id' => Sale::factory(),
            'organization_id' => fn (array $attributes) => Sale::withoutTenant()->whereKey($attributes['sale_id'])->value('organization_id'),
            'customer_id' => fn (array $attributes) => Sale::withoutTenant()->whereKey($attributes['sale_id'])->value('customer_id'),
            'number' => 1,
            'amount_cents' => fake()->numberBetween(1000, 20000),
            'due_date' => now()->addMonth()->toDateString(),
        ];
    }

    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => ['due_date' => now()->subDays(5)->toDateString()]);
    }
}
