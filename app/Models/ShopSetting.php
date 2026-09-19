<?php

namespace App\Models;

use App\Enums\PixKeyType;
use App\Models\Concerns\BelongsToTenant;
use Database\Factories\ShopSettingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $organization_id
 * @property string|null $pix_key
 * @property PixKeyType|null $pix_key_type
 * @property bool $catalog_public
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['pix_key', 'pix_key_type', 'catalog_public'])]
class ShopSetting extends Model
{
    /** @use HasFactory<ShopSettingFactory> */
    use BelongsToTenant, HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'pix_key_type' => PixKeyType::class,
            'catalog_public' => 'boolean',
        ];
    }
}
