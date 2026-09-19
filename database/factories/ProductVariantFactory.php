<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'organization_id' => fn (array $attributes) => Product::withoutTenant()->whereKey($attributes['product_id'])->value('organization_id'),
            'name' => fake()->randomElement(['P', 'M', 'G']),
            'sku' => fake()->unique()->bothify('SKU-####'),
            'price_cents' => null,
            'stock_qty' => fake()->numberBetween(0, 20),
        ];
    }
}
