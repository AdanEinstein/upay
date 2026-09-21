<?php

namespace App\Http\Controllers;

use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PlanLimitController extends Controller
{
    public function __invoke(): Response|RedirectResponse
    {
        $organization = Tenant::current();
        $limit = $organization->customerLimit();

        if ($limit === null) {
            return to_route('dashboard');
        }

        return Inertia::render('plan-limit', [
            'plan' => ['name' => $organization->subscription->plan->name],
            'limit' => $limit,
            'used' => $organization->customerCount(),
        ]);
    }
}
