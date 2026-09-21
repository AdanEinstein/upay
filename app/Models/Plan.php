<?php

namespace App\Models;

use Database\Factories\PlanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $slug
 * @property string $name
 * @property int $price_cents
 * @property int|null $annual_price_cents
 * @property array<string, int|null> $limits
 * @property bool $active
 * @property bool $featured
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read int $organizations_count Only loaded via `withCount`.
 */
#[Fillable(['slug', 'name', 'price_cents', 'annual_price_cents', 'limits', 'active', 'featured'])]
class Plan extends Model
{
    /** @use HasFactory<PlanFactory> */
    use HasFactory;

    /**
     * Keys of the `limits` json; a missing or null value means unlimited.
     *
     * @var list<string>
     */
    public const array LIMIT_KEYS = [
        'max_customers',
        'max_products',
        'max_photos_per_product',
        'max_sales_per_month',
        'max_users',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'limits' => 'array',
            'active' => 'boolean',
            'featured' => 'boolean',
        ];
    }

    /**
     * Null means unlimited.
     */
    public function maxCustomers(): ?int
    {
        return $this->limits['max_customers'] ?? null;
    }

    /**
     * @return HasMany<Subscription, $this>
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * @return array{slug: string, name: string, priceCents: int, maxCustomers: int|null, maxProducts: int|null, maxUsers: int|null, featured: bool}
     */
    public function toPublicArray(): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->name,
            'priceCents' => $this->price_cents,
            'maxCustomers' => $this->maxCustomers(),
            'maxProducts' => $this->limits['max_products'] ?? null,
            'maxUsers' => $this->limits['max_users'] ?? null,
            'featured' => $this->featured,
        ];
    }

    /**
     * @return Collection<int, array{slug: string, name: string, priceCents: int, maxCustomers: int|null, maxProducts: int|null, maxUsers: int|null, featured: bool}>
     */
    public static function publicList(): Collection
    {
        return static::query()
            ->where('active', true)
            ->orderBy('price_cents')
            ->get()
            ->map(fn (Plan $plan) => $plan->toPublicArray());
    }

    public static function uniqueSlugFor(string $name): string
    {
        $base = Str::slug($name) ?: 'plano';
        $slug = $base;

        for ($suffix = 2; static::query()->where('slug', $slug)->exists(); $suffix++) {
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }
}
