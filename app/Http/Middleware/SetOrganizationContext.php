<?php

namespace App\Http\Middleware;

use App\Enums\SubscriptionStatus;
use App\Models\Organization;
use App\Support\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class SetOrganizationContext
{
    /**
     * Resolve the organization from the {organization} route slug, verify the
     * authenticated user belongs to it, and make it the active tenant for the
     * duration of the request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $organization = Organization::query()
            ->where('slug', $request->route('organization'))
            ->firstOrFail();

        if (! $organization->isActive() && ! $request->routeIs('billing.*')) {
            // A store suspended for non-payment can still reach the billing screen to pay.
            abort_unless($organization->subscription?->status === SubscriptionStatus::PastDue, 404);

            return redirect()->route('billing.show', ['organization' => $organization->slug]);
        }

        if ($user = $request->user()) {
            abort_unless($user->organization_id === $organization->id, 403);
        }

        // Controllers type-hint route models, so the tenant slug must not be
        // passed to them as a leading positional argument.
        $request->route()->forgetParameter('organization');

        Tenant::use($organization);
        URL::defaults(['organization' => $organization->slug]);

        try {
            return $next($request);
        } finally {
            Tenant::forget();
        }
    }
}
