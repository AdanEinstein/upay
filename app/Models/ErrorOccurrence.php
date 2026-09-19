<?php

namespace App\Models;

use Database\Factories\ErrorOccurrenceFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $organization_id
 * @property int|null $user_id
 * @property int $status
 * @property string $method
 * @property string $path
 * @property string|null $exception_class
 * @property string|null $message
 * @property string|null $trace
 * @property Carbon $created_at
 */
class ErrorOccurrence extends Model
{
    /** @use HasFactory<ErrorOccurrenceFactory> */
    use HasFactory, Prunable;

    const UPDATED_AT = null;

    protected $guarded = ['id'];

    /**
     * @return Builder<ErrorOccurrence>
     */
    public function prunable(): Builder
    {
        return static::where('created_at', '<', now()->subDays(30));
    }

    /**
     * @return BelongsTo<Organization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
