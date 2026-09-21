<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\InstallmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $organization_id
 * @property int $sale_id
 * @property int|null $customer_id
 * @property int $number
 * @property int $amount_cents
 * @property Carbon $due_date
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['sale_id', 'customer_id', 'number', 'amount_cents', 'due_date'])]
class Installment extends Model
{
    /** @use HasFactory<InstallmentFactory> */
    use BelongsToTenant, HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
        ];
    }

    /**
     * @param  Builder<static>  $builder
     * @return Builder<static>
     */
    public function scopeUnpaid(Builder $builder): Builder
    {
        return $builder->whereRaw(static::remainingSql().' > 0');
    }

    /**
     * Adds `remaining_cents` to every row.
     *
     * @param  Builder<static>  $builder
     * @return Builder<static>
     */
    public function scopeWithRemaining(Builder $builder): Builder
    {
        return $builder->select('installments.*')->selectRaw('('.static::remainingSql().') as remaining_cents');
    }

    /**
     * SQL expression for what is still owed on an installment.
     */
    public static function remainingSql(): string
    {
        return 'installments.amount_cents - coalesce((select sum(p.amount_cents) from payments p where p.installment_id = installments.id), 0)';
    }

    public function paidCents(): int
    {
        return (int) $this->payments()->sum('amount_cents');
    }

    public function remainingCents(): int
    {
        return max(0, $this->amount_cents - $this->paidCents());
    }

    /**
     * @return BelongsTo<Sale, $this>
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * @return HasMany<PaymentClaim, $this>
     */
    public function claims(): HasMany
    {
        return $this->hasMany(PaymentClaim::class);
    }
}
