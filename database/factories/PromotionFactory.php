<?php

namespace Database\Factories;

use App\Enums\PromotionType;
use App\Models\Organization;
use App\Models\Promotion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Promotion>
 */
class PromotionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'organization_id' => Organization::factory(),
            'name' => fake()->words(3, true),
            'type' => PromotionType::Percent,
            'percent' => 20,
        ];
    }
}
