<?php

namespace App\Models;

use App\Enums\ClaimStatus;
use App\Models\Concerns\BelongsToTenant;
use Database\Factories\PaymentClaimFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A customer's "I already paid" notice. It never counts as a payment until the store confirms it.
 *
 * @property int $id
 * @property int $organization_id
 * @property int $installment_id
 * @property int $amount_cents
 * @property ClaimStatus $status
 * @property string|null $receipt_path
 * @property Carbon|null $resolved_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['installment_id', 'amount_cents', 'status', 'receipt_path', 'resolved_at'])]
class PaymentClaim extends Model
{
    /** @use HasFactory<PaymentClaimFactory> */
    use BelongsToTenant, HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ClaimStatus::class,
            'resolved_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Installment, $this>
     */
    public function installment(): BelongsTo
    {
        return $this->belongsTo(Installment::class);
    }
}
