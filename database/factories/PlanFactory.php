<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'slug' => Str::slug($name),
            'name' => ucfirst($name),
            'price_cents' => 2990,
            'limits' => ['max_customers' => 50],
            'active' => true,
        ];
    }

    public function maxCustomers(?int $max): static
    {
        return $this->state(fn (array $attributes) => ['limits' => ['max_customers' => $max]]);
    }
}
