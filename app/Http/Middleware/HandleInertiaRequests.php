<?php

namespace App\Http\Middleware;

use App\Support\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'locale' => str_replace('_', '-', app()->getLocale()),
            // Resolved lazily (not here) because this middleware runs in the
            // global "web" group, before the route-specific
            // SetOrganizationContext middleware has called Tenant::use() —
            // a closure defers evaluation until the response is built.
            'tenant' => fn () => ($organization = Tenant::current()) ? [
                'id' => $organization->id,
                'slug' => $organization->slug,
                'name' => $organization->name,
                'logoUrl' => $organization->logo_path ? Storage::url($organization->logo_path) : null,
                'accentColor' => $organization->accent_color,
                'accentColorHover' => $organization->accent_color_hover,
                'accentColorSoft' => $organization->accent_color_soft,
                'onPrimaryColor' => $organization->on_primary_color,
            ] : null,
        ];
    }
}
