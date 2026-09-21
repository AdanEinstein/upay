<?php

namespace App\Http\Controllers\Super;

use App\Http\Controllers\Controller;
use App\Http\Requests\Super\OrganizationSubscriptionRequest;
use App\Models\Organization;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;

class OrganizationSubscriptionController extends Controller
{
    public function __invoke(OrganizationSubscriptionRequest $request, Organization $organization): RedirectResponse
    {
        $plan = Plan::query()->findOrFail((int) $request->validated('plan_id'));

        // The price is frozen on the subscription (MRR base), so a plan change re-prices it.
        $organization->subscription()->updateOrCreate([], [
            'plan_id' => $plan->id,
            'price_cents' => $plan->price_cents,
            'canceled_at' => null,
        ]);

        return to_route('super-admin.organizations.index');
    }
}
