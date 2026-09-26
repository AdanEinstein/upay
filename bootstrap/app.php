<?php

use App\Http\Middleware\ContentSecurityPolicy;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetOrganizationContext;
use App\Http\Middleware\SetUserLocale;
use App\Support\ErrorOccurrenceRecorder;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Routing\Router;
use Inertia\ExceptionResponse;
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
            ContentSecurityPolicy::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request): Response {
            $status = $response->getStatusCode();
            $errorId = ErrorOccurrenceRecorder::record($request, $exception, $status);

            // Friendly Inertia error page instead of Laravel's raw one.
            // `testing` keeps the raw response so the suite isn't affected;
            // `local` keeps it only for 500s, which need Ignition's trace.
            if (! in_array($status, [401, 403, 404, 419, 429, 500, 503], true)
                || $request->is('api/*')
                || $request->expectsJson()
                || app()->environment('testing')
                || (app()->environment('local') && $status === 500)) {
                return $response;
            }

            $organization = $request->route('organization');

            return (new ExceptionResponse($exception, $request, $response, app(Router::class), app(Kernel::class)))
                ->render('error', [
                    'status' => $status,
                    'loginUrl' => match (true) {
                        is_string($organization) => route('login', ['organization' => $organization]),
                        $request->is('super-admin', 'super-admin/*') => route('super-admin.login'),
                        default => null,
                    },
                    'errorId' => $errorId,
                ])
                ->withSharedData()
                ->toResponse($request);
        });
    })->create();
