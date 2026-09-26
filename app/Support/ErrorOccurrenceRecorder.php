<?php

namespace App\Support;

use App\Models\ErrorOccurrence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ErrorOccurrenceRecorder
{
    /**
     * HTTP statuses worth surfacing on the super-admin observability screen.
     *
     * @var list<int>
     */
    public const array RECORDED_STATUSES = [401, 403, 404, 419, 429, 500, 503];

    /**
     * Persist the error for the super-admin screen. Never lets a failure here
     * take down the error response itself.
     *
     * Identical occurrences (same status + exception class + path) within a
     * 60s window collapse into one row, so a bot hammering a 404 or a
     * recurring 500 can't flood the table.
     *
     * Returns the new row's id, or null when nothing was stored (status not
     * tracked, deduplicated, or the insert failed).
     */
    public static function record(Request $request, Throwable $exception, int $status): ?int
    {
        if (! in_array($status, self::RECORDED_STATUSES, true)) {
            return null;
        }

        try {
            $fingerprint = 'error-occurrence:'.md5($status.'|'.$exception::class.'|'.$request->path());

            if (! Cache::add($fingerprint, true, 60)) {
                return null;
            }

            $user = $request->user('web');

            return ErrorOccurrence::query()->create([
                'organization_id' => Tenant::id() ?? $user?->organization_id,
                'user_id' => $user?->id,
                'status' => $status,
                'method' => $request->method(),
                'path' => $request->path(),
                'exception_class' => $exception::class,
                'message' => $exception->getMessage(),
                'trace' => Str::limit($exception->getTraceAsString(), 20000, ''),
            ])->id;
        } catch (Throwable $e) {
            Log::error('Failed to record error occurrence', ['exception' => $e]);

            return null;
        }
    }
}
