<?php

namespace App\Models;

use App\Enums\PromotionType;
use App\Models\Concerns\BelongsToTenant;
use Database\Factories\PromotionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $organization_id
 * @property string $name
 * @property PromotionType $type
 * @property int|null $percent
 * @property int|null $original_price_cents
 * @property int|null $promo_price_cents
 * @property Carbon|null $starts_on
 * @property Carbon|null $ends_on
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'type', 'percent', 'original_price_cents', 'promo_price_cents', 'starts_on', 'ends_on'])]
class Promotion extends Model
{
    /** @use HasFactory<PromotionFactory> */
    use BelongsToTenant, HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => PromotionType::class,
            'starts_on' => 'date',
            'ends_on' => 'date',
        ];
    }

    /**
     * @return BelongsToMany<Product, $this>
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class);
    }

    /**
     * @param  Builder<static>  $builder
     * @return Builder<static>
     */
    public function scopeActive(Builder $builder): Builder
    {
        return $builder
            ->where(fn (Builder $query) => $query->whereNull('starts_on')->orWhere('starts_on', '<=', today()))
            ->where(fn (Builder $query) => $query->whereNull('ends_on')->orWhere('ends_on', '>=', today()));
    }

    /**
     * @param  Builder<static>  $builder
     * @return Builder<static>
     */
    public function scopeScheduled(Builder $builder): Builder
    {
        return $builder->where('starts_on', '>', today());
    }

    /**
     * @param  Builder<static>  $builder
     * @return Builder<static>
     */
    public function scopeExpired(Builder $builder): Builder
    {
        return $builder->where('ends_on', '<', today());
    }
}
