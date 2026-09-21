<?php

use App\Enums\SubscriptionStatus;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function subscribe(Plan $plan, int $priceCents, array $attributes = []): Subscription
{
    return Subscription::factory()->for(Plan::query()->findOrFail($plan->id))->create([
        'organization_id' => Organization::factory()->create(['created_at' => now()->subMonths(3)])->id,
        'price_cents' => $priceCents,
        ...$attributes,
    ]);
}

test('the dashboard requires super admin authentication', function () {
    $this->get(route('super-admin.dashboard'))->assertRedirect(route('super-admin.login'));
});

test('the dashboard computes MRR, growth, churn, past due and plan mix', function () {
    $this->travelTo(now()->startOfMonth()->addDays(10));

    $basic = Plan::factory()->create(['name' => 'Basic']);
    $pro = Plan::factory()->create(['name' => 'Pro']);

    subscribe($basic, 3000, ['created_at' => now()->subMonths(2)]);
    subscribe($pro, 5000, ['created_at' => now()->subMonths(2), 'status' => SubscriptionStatus::PastDue]);
    subscribe($pro, 5000, ['created_at' => now()->subDay()]);
    subscribe($basic, 3000, ['created_at' => now()->subMonths(3), 'canceled_at' => now()->subDays(2)]);

    Organization::factory()->count(2)->create(['created_at' => now()->subDay()]);
    Organization::factory()->suspended()->create(['created_at' => now()->subMonths(2)]);

    $this->actingAs(superAdminActor(), 'super_admin')
        ->get(route('super-admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super/dashboard')
            ->where('mrrCents', 13000)
            // previous month closed at 3000 + 5000 + 3000 (canceled only this month)
            ->where('mrrChangePercent', 18.2)
            // 4 organizations from the subscriptions + 2 new ones; the suspended one is excluded
            ->where('activeOrganizations', 6)
            ->where('newOrganizations', 2)
            ->where('churn.count', 1)
            ->where('churn.percent', 33.3)
            ->where('pastDue', 1)
            ->has('series', 12)
            ->where('series.11.mrrCents', 13000)
            ->where('byPlan.0', ['name' => 'Pro', 'count' => 2, 'percent' => 67])
            ->where('byPlan.1', ['name' => 'Basic', 'count' => 1, 'percent' => 33]));
});

test('the dashboard handles an empty platform', function () {
    $this->actingAs(superAdminActor(), 'super_admin')
        ->get(route('super-admin.dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('mrrCents', 0)
            ->where('mrrChangePercent', null)
            ->where('churn.percent', null)
            ->where('byPlan', []));
});
