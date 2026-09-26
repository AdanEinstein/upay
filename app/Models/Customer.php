<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $organization_id
 * @property string $name
 * @property string|null $phone
 * @property string|null $document
 * @property string|null $address
 * @property string|null $notes
 * @property string $public_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read int $balance_cents Only loaded via `withBalance()`.
 */
#[Fillable(['name', 'phone', 'document', 'address', 'notes'])]
class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use BelongsToTenant, HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Customer $customer) {
            $customer->public_token ??= Str::random(40);
        });
    }

    /**
     * Swap the public debt link token, invalidating the old link (e.g. after it leaked).
     */
    public function rotatePublicToken(): void
    {
        $this->forceFill(['public_token' => Str::random(40)])->save();
    }

    /**
     * Adds `balance_cents` (installments minus payments) to every row.
     *
     * @param  Builder<static>  $builder
     * @return Builder<static>
     */
    public function scopeWithBalance(Builder $builder): Builder
    {
        return $builder->select('customers.*')->selectRaw(
            '(coalesce((select sum(i.amount_cents) from installments i where i.customer_id = customers.id), 0)'
            .' - coalesce((select sum(p.amount_cents) from payments p join installments i on i.id = p.installment_id where i.customer_id = customers.id), 0)) as balance_cents',
        );
    }

    /**
     * @return BelongsTo<Organization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * @return HasMany<Sale, $this>
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    /**
     * @return HasMany<Installment, $this>
     */
    public function installments(): HasMany
    {
        return $this->hasMany(Installment::class);
    }
}
