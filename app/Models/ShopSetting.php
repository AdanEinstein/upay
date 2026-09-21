<?php

namespace App\Models;

use App\Enums\NoticeType;
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
 * @property string|null $welcome_text
 * @property string|null $whatsapp
 * @property string|null $cover_path
 * @property string|null $notice_text
 * @property NoticeType $notice_type
 * @property Carbon|null $notice_expires_on
 * @property bool $notice_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['pix_key', 'pix_key_type', 'catalog_public', 'welcome_text', 'whatsapp', 'cover_path', 'notice_text', 'notice_type', 'notice_expires_on', 'notice_active'])]
class ShopSetting extends Model
{
    /** @use HasFactory<ShopSettingFactory> */
    use BelongsToTenant, HasFactory;

    /**
     * The current tenant's single settings row, created on first access.
     */
    public static function current(): static
    {
        return static::query()->firstOrCreate([]);
    }

    public function hasLiveNotice(): bool
    {
        return $this->notice_active
            && filled($this->notice_text)
            && ($this->notice_expires_on === null || ! $this->notice_expires_on->isBefore(today()));
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'pix_key_type' => PixKeyType::class,
            'catalog_public' => 'boolean',
            'notice_type' => NoticeType::class,
            'notice_expires_on' => 'date',
            'notice_active' => 'boolean',
        ];
    }
}
