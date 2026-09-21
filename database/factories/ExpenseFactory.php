<?php

namespace Database\Factories;

use App\Models\Expense;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
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
            'description' => fake()->sentence(3),
            'amount_cents' => fake()->numberBetween(500, 30000),
            'category' => null,
            'paid_at' => now(),
            'due_date' => now()->toDateString(),
        ];
    }
}
