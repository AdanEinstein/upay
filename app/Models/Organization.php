<?php

namespace App\Models;

use App\Enums\OrganizationStatus;
use Database\Factories\OrganizationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property OrganizationStatus $status
 * @property string|null $suspension_reason
 * @property string|null $logo_path
 * @property string|null $favicon_path
 * @property string $accent_color
 * @property string $accent_color_hover
 * @property string $accent_color_soft
 * @property string $on_primary_color
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read int $sales_month_count Only loaded via `withCount`.
 */
#[Fillable(['name', 'slug', 'status', 'suspension_reason', 'accent_color', 'accent_color_hover', 'accent_color_soft', 'on_primary_color'])]
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
    public const array RESERVED_SLUGS = ['super-admin', 'p', 'c'];

    /**
     * Marker stored in suspension_reason when billing (not the super admin) suspended the store.
     */
    public const string BILLING_SUSPENSION_REASON = 'billing_overdue';

    /**
     * Brand colors every organization starts with (same as the column defaults).
     *
     * @var array<string, string>
     */
    public const array DEFAULT_COLORS = [
        'accent_color' => '#3667f6',
        'accent_color_hover' => '#2454e0',
        'accent_color_soft' => '#eef3ff',
        'on_primary_color' => '#ffffff',
    ];

    /**
     * Accent colors offered in the catalog identity screen, with the derived tokens.
     *
     * @var array<string, array{hover: string, soft: string, on_primary: string}>
     */
    public const array ACCENT_PALETTE = [
        '#3667f6' => ['hover' => '#2a52c4', 'soft' => '#e8eefe', 'on_primary' => '#ffffff'],
        '#16a34a' => ['hover' => '#12833b', 'soft' => '#e3f5ea', 'on_primary' => '#ffffff'],
        '#ea580c' => ['hover' => '#bb460a', 'soft' => '#fcebe0', 'on_primary' => '#ffffff'],
        '#db2777' => ['hover' => '#af1f5f', 'soft' => '#fae4ee', 'on_primary' => '#ffffff'],
        '#7c3aed' => ['hover' => '#6330be', 'soft' => '#ede4fc', 'on_primary' => '#ffffff'],
    ];

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

    /**
     * @return HasMany<Customer, $this>
     */
    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * @return HasMany<Sale, $this>
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    /**
     * @return HasOne<Subscription, $this>
     */
    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    /**
     * @return HasMany<SubscriptionInvoice, $this>
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(SubscriptionInvoice::class);
    }

    /**
     * Slugified name, suffixed with -2, -3... until it is free and not reserved.
     */
    public static function uniqueSlugFor(string $name): string
    {
        $base = Str::slug($name) ?: 'loja';
        $slug = $base;

        for ($suffix = 2; in_array($slug, self::RESERVED_SLUGS, true) || static::query()->where('slug', $slug)->exists(); $suffix++) {
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }

    /**
     * Null means unlimited (including organizations without a subscription).
     */
    public function customerLimit(): ?int
    {
        return $this->subscription?->plan->maxCustomers();
    }

    public function customerCount(): int
    {
        return $this->customers()->withoutTenant()->count();
    }

    public function hasReachedCustomerLimit(): bool
    {
        $limit = $this->customerLimit();

        return $limit !== null && $this->customerCount() >= $limit;
    }

    /**
     * Plan consumption shown to the merchant. A null limit means unlimited.
     *
     * @return list<array{key: string, used: int, limit: int|null}>
     */
    public function planUsage(): array
    {
        $limits = $this->subscription?->plan->limits ?? [];

        return [
            ['key' => 'customers', 'used' => $this->customerCount(), 'limit' => $limits['max_customers'] ?? null],
            ['key' => 'products', 'used' => $this->products()->withoutTenant()->count(), 'limit' => $limits['max_products'] ?? null],
            ['key' => 'sales', 'used' => $this->sales()->withoutTenant()->where('sold_at', '>=', now()->startOfMonth())->count(), 'limit' => $limits['max_sales_per_month'] ?? null],
        ];
    }

    public function isActive(): bool
    {
        return $this->status === OrganizationStatus::Active;
    }
}
