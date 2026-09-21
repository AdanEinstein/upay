<?php

namespace App\Models;

use App\Enums\SaleStatus;
use App\Models\Concerns\BelongsToTenant;
use Database\Factories\SaleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $organization_id
 * @property int|null $customer_id
 * @property int $total_cents
 * @property SaleStatus $status
 * @property Carbon $sold_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['customer_id', 'total_cents', 'status', 'sold_at'])]
class Sale extends Model
{
    /** @use HasFactory<SaleFactory> */
    use BelongsToTenant, HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => SaleStatus::class,
            'sold_at' => 'datetime',
        ];
    }

    /**
     * Where the sale stands in terms of money. Needs `installments.payments` loaded.
     *
     * @return array{status: string, date: string|null}
     */
    public function settlement(): array
    {
        if ($this->status === SaleStatus::Cancelled) {
            return ['status' => 'cancelled', 'date' => null];
        }

        $open = $this->installments
            ->filter(fn (Installment $installment) => $installment->amount_cents > $installment->payments->sum('amount_cents'))
            ->sortBy('due_date');

        if ($open->isEmpty()) {
            return ['status' => 'paid', 'date' => $this->installments->flatMap->payments->max('paid_at')?->toDateString()];
        }

        $due = $open->first()->due_date;

        return [
            'status' => $due->isToday() ? 'due_today' : ($due->isPast() ? 'overdue' : 'upcoming'),
            'date' => $due->toDateString(),
        ];
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return HasMany<SaleItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * @return HasMany<Installment, $this>
     */
    public function installments(): HasMany
    {
        return $this->hasMany(Installment::class);
    }
}
