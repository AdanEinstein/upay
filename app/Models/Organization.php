<?php

namespace App\Models;

use App\Enums\OrganizationStatus;
use Database\Factories\OrganizationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property OrganizationStatus $status
 * @property string|null $logo_path
 * @property string|null $favicon_path
 * @property string $accent_color
 * @property string $accent_color_hover
 * @property string $accent_color_soft
 * @property string $on_primary_color
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'slug', 'status', 'accent_color', 'accent_color_hover', 'accent_color_soft', 'on_primary_color'])]
class Organization extends Model
{
    /** @use HasFactory<OrganizationFactory> */
    use HasFactory;

    /**
     * Slugs that must never be assigned to a tenant: they collide with
     * platform routes (see Route::pattern('organization', ...) in
     * AppServiceProvider) and would make the tenant unreachable.
     *
     * @var list<string>
     */
    public const array RESERVED_SLUGS = ['super-admin'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => OrganizationStatus::class,
        ];
    }

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === OrganizationStatus::Active;
    }
}
