<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetUserLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        // Explicitly the "web" guard: the super_admin guard authenticates a
        // separate SuperAdminUser with no locale preference of its own.
        if ($user = $request->user('web')) {
            App::setLocale($user->locale->value);
        }

        return $next($request);
    }
}
