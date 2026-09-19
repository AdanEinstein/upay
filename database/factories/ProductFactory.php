<?php

namespace Database\Factories;

use App\Models\Organization;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
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
            'name' => fake()->words(2, true),
            'description' => fake()->sentence(),
            'price_cents' => fake()->numberBetween(1000, 50000),
            'stock_qty' => fake()->numberBetween(5, 50),
            'min_stock' => 3,
            'active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => ['active' => false]);
    }

    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => ['stock_qty' => 1, 'min_stock' => 3]);
    }
}
