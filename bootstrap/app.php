<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetOrganizationContext;
use App\Http\Middleware\SetUserLocale;
use App\Support\ErrorOccurrenceRecorder;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Containers only listen on 127.0.0.1, so the host nginx (TLS
        // terminator) is the only thing that can reach them.
        $middleware->trustProxies(at: '*');

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->route('organization')) {
                return route('login', ['organization' => $request->route('organization')]);
            }

            return route('super-admin.login');
        });

        $middleware->redirectUsersTo(function (Request $request) {
            if ($request->routeIs('super-admin.*')) {
                return route('super-admin.dashboard');
            }

            $slug = $request->user()?->organization?->slug;

            return $slug ? route('dashboard', ['organization' => $slug]) : route('home');
        });

        // Route model bindings on tenant-scoped models must resolve after the
        // tenant is active, otherwise BelongsToTenant's scope is a no-op and a
        // user could load another organization's records by id.
        $middleware->prependToPriorityList(
            before: SubstituteBindings::class,
            prepend: SetOrganizationContext::class,
        );

        $middleware->web(append: [
            HandleAppearance::class,
            SetUserLocale::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request): Response {
            ErrorOccurrenceRecorder::record($request, $exception, $response->getStatusCode());

            return $response;
        });
    })->create();
