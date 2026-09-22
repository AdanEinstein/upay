<?php

namespace App\Http\Controllers\Super;

use App\Enums\OrganizationStatus;
use App\Enums\SaleStatus;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Super\OrganizationStoreRequest;
use App\Http\Requests\Super\OrganizationUpdateRequest;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('super/organizations', [
            'organizations' => Organization::query()
                ->with(['subscription.plan', 'users' => fn ($query) => $query->oldest('id')])
                ->withCount([
                    'users',
                    'customers',
                    'products',
                    'sales as sales_month_count' => fn ($query) => $query
                        ->where('status', SaleStatus::Completed)
                        ->where('sold_at', '>=', now()->startOfMonth()),
                ])
                ->latest()
                ->get()
                ->map(fn (Organization $organization) => [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'slug' => $organization->slug,
                    'status' => $organization->status->value,
                    'suspensionReason' => $organization->suspension_reason,
                    'createdAt' => $organization->created_at->toDateString(),
                    'plan' => $organization->subscription
                        ? ['id' => $organization->subscription->plan_id, 'name' => $organization->subscription->plan->name, 'cycle' => $organization->subscription->billing_cycle->value]
                        : null,
                    'pastDue' => $organization->subscription?->status === SubscriptionStatus::PastDue,
                    'owner' => ($owner = $organization->users->first())
                        ? ['name' => $owner->name, 'email' => $owner->email]
                        : null,
                    'usersCount' => $organization->users_count,
                    'customersCount' => $organization->customers_count,
                    'productsCount' => $organization->products_count,
                    'salesMonthCount' => $organization->sales_month_count,
                ]),
            'plans' => Plan::query()->where('active', true)->orderBy('price_cents')->get(['id', 'name']),
            'statuses' => array_column(OrganizationStatus::cases(), 'value'),
            'kpis' => [
                'total' => Organization::query()->count(),
                'active' => Organization::query()->where('status', OrganizationStatus::Active)->count(),
                'suspended' => Organization::query()->where('status', OrganizationStatus::Suspended)->count(),
                'users' => User::query()->whereNotNull('organization_id')->count(),
                'pastDue' => Organization::query()->whereHas('subscription', fn ($query) => $query->where('status', SubscriptionStatus::PastDue))->count(),
            ],
        ]);
    }

    public function store(OrganizationStoreRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $organization = Organization::create([
                'name' => $request->validated('name'),
                'slug' => $request->validated('slug'),
            ]);

            $organization->users()->create([
                'name' => $request->validated('admin_name'),
                'email' => $request->validated('admin_email'),
                'password' => $request->validated('admin_password'),
            ]);
        });

        return to_route('super-admin.organizations.index');
    }

    public function update(OrganizationUpdateRequest $request, Organization $organization): RedirectResponse
    {
        $organization->update([
            'name' => $request->validated('name'),
            'slug' => $request->validated('slug'),
            'status' => $request->validated('status'),
            ...($request->validated('status') === OrganizationStatus::Active->value ? ['suspension_reason' => null] : []),
        ]);

        return to_route('super-admin.organizations.index');
    }

    public function destroy(Organization $organization): RedirectResponse
    {
        // users.organization_id is nullOnDelete: without this the organization's
        // users would survive as orphans holding their e-mail forever.
        DB::transaction(function () use ($organization): void {
            $organization->users()->delete();
            $organization->delete();
        });

        return to_route('super-admin.organizations.index');
    }
}
