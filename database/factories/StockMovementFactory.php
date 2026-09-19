<?php

namespace Database\Factories;

use App\Enums\StockMovementReason;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockMovement>
 */
class StockMovementFactory extends Factory
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
            'product_variant_id' => null,
            'sale_id' => null,
            'quantity_delta' => -1,
            'reason' => StockMovementReason::Adjustment,
        ];
    }
}
