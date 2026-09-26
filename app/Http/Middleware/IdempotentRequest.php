<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Runs a request carrying an Idempotency-Key at most once per user, so the
 * offline queue (resources/js/lib/offline-queue.ts) can safely resend an
 * action whose first attempt reached the server but never got an answer back.
 * Failed attempts (4xx/5xx) don't burn the key, so a fixed item can be resent.
 */
class IdempotentRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('Idempotency-Key');

        if ($key === null) {
            return $next($request);
        }

        abort_unless(Str::isUuid($key), 400);

        $done = "idempotency:{$request->user()->id}:{$key}";

        if (Cache::has($done)) {
            return response()->noContent();
        }

        $lock = Cache::lock("{$done}:lock", 30);

        // Another attempt with the same key is still running; the queue retries later.
        abort_unless($lock->get(), 409);

        try {
            if (Cache::has($done)) {
                return response()->noContent();
            }

            $response = $next($request);

            if ($response->getStatusCode() < 400) {
                Cache::put($done, true, now()->addDays(30));
            }

            return $response;
        } finally {
            $lock->release();
        }
    }
}
