<?php

namespace Database\Factories;

use App\Enums\PixKeyType;
use App\Models\Organization;
use App\Models\ShopSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ShopSetting>
 */
class ShopSettingFactory extends Factory
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
            'pix_key' => fake()->safeEmail(),
            'pix_key_type' => PixKeyType::Email,
            'catalog_public' => false,
        ];
    }
}
