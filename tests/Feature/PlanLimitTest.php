<?php

use App\Models\Customer;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function organizationOnPlan(?int $maxCustomers, int $customers = 0): Organization
{
    $organization = Organization::factory()->create();
    Subscription::factory()->for($organization)->for(Plan::factory()->maxCustomers($maxCustomers))->create();
    Customer::factory()->count($customers)->create(['organization_id' => $organization->id]);

    return $organization;
}

test('the plan limit is reached only when customers hit the plan maximum', function (?int $max, int $customers, bool $reached) {
    expect(organizationOnPlan($max, $customers)->hasReachedCustomerLimit())->toBe($reached);
})->with([
    'below the limit' => [3, 2, false],
    'at the limit' => [3, 3, true],
    'unlimited plan' => [null, 5, false],
]);

test('an organization without a subscription is unlimited', function () {
    expect(Organization::factory()->create()->hasReachedCustomerLimit())->toBeFalse();
});

test('the plan limit page shows plan name and usage', function () {
    $organization = organizationOnPlan(3, 3);
    $user = User::factory()->create(['organization_id' => $organization->id]);

    $this->actingAs($user)
        ->get(route('plan-limit.show', ['organization' => $organization->slug]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('plan-limit')
            ->where('plan.name', $organization->subscription->plan->name)
            ->where('limit', 3)
            ->where('used', 3),
        );
});

test('the plan limit page redirects to the dashboard when there is no limit', function () {
    $organization = organizationOnPlan(null);
    $user = User::factory()->create(['organization_id' => $organization->id]);

    $this->actingAs($user)
        ->get(route('plan-limit.show', ['organization' => $organization->slug]))
        ->assertRedirect(route('dashboard', ['organization' => $organization->slug], absolute: false));
});
