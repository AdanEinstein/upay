<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SaleItem>
 */
class SaleItemFactory extends Factory
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
            'product_id' => fn (array $attributes) => Product::factory()->create(['organization_id' => $attributes['organization_id']])->id,
            'product_variant_id' => null,
            'quantity' => fake()->numberBetween(1, 3),
            'unit_price_cents' => fake()->numberBetween(1000, 20000),
        ];
    }
}
