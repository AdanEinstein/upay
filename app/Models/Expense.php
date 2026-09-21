<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Carbon\CarbonInterface;
use Database\Factories\ExpenseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $organization_id
 * @property string $description
 * @property int $amount_cents
 * @property string|null $category
 * @property Carbon|null $paid_at
 * @property Carbon|null $due_date
 * @property bool $recurring
 * @property string|null $receipt_path
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['description', 'amount_cents', 'category', 'due_date', 'recurring', 'receipt_path', 'paid_at'])]
class Expense extends Model
{
    /** @use HasFactory<ExpenseFactory> */
    use BelongsToTenant, HasFactory;

    /**
     * @var list<string>
     */
    public const array CATEGORIES = ['suppliers', 'rent', 'transport', 'marketing', 'other'];

    /**
     * Settles the expense and, if it recurs monthly, schedules next month's.
     */
    public function markPaid(?CarbonInterface $at = null): void
    {
        if ($this->paid_at !== null) {
            return;
        }

        $this->update(['paid_at' => $at ?? now()]);

        if ($this->recurring) {
            static::create([
                'description' => $this->description,
                'amount_cents' => $this->amount_cents,
                'category' => $this->category,
                'due_date' => $this->due_date->addMonthNoOverflow()->toDateString(),
                'recurring' => true,
                'paid_at' => null,
            ]);
        }
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'due_date' => 'date',
            'recurring' => 'boolean',
        ];
    }
}
