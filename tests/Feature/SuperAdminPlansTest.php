<?php

use App\Models\Plan;
use Database\Factories\SubscriptionFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function planPayload(array $overrides = []): array
{
    return [
        'name' => 'Premium Plus',
        'price_cents' => 12990,
        'annual_price_cents' => 129900,
        'limits' => ['max_customers' => 1000, 'max_products' => null],
        'active' => true,
        'featured' => false,
        ...$overrides,
    ];
}

test('plans area requires super admin authentication', function () {
    $this->get(route('super-admin.plans.index'))->assertRedirect(route('super-admin.login'));
});

test('super admin lists plans with their active organization count', function () {
    $plan = Plan::query()->where('slug', 'basico')->firstOrFail();
    SubscriptionFactory::new()->count(2)->create(['plan_id' => $plan->id]);
    SubscriptionFactory::new()->create(['plan_id' => $plan->id, 'canceled_at' => now()]);

    $this->actingAs(superAdminActor(), 'super_admin')
        ->get(route('super-admin.plans.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super/plans')
            ->has('plans', 3)
            ->where('plans.0.name', 'Básico')
            ->where('plans.0.organizationsCount', 2)
            ->where('plans.0.limits.max_customers', 100)
            ->where('plans.0.limits.max_users', null));
});

test('super admin creates a plan with a unique slug and normalized limits', function () {
    $this->actingAs(superAdminActor(), 'super_admin')
        ->post(route('super-admin.plans.store'), planPayload(['name' => 'Básico']))
        ->assertRedirect(route('super-admin.plans.index'));

    $plan = Plan::query()->where('name', 'Básico')->where('slug', 'basico-2')->firstOrFail();

    expect($plan->price_cents)->toBe(12990)
        ->and($plan->limits)->toBe([
            'max_customers' => 1000,
            'max_products' => null,
            'max_photos_per_product' => null,
            'max_sales_per_month' => null,
            'max_users' => null,
        ]);
});

test('featuring a plan un-features the previous one', function () {
    $pro = Plan::query()->where('slug', 'pro')->firstOrFail();
    expect($pro->featured)->toBeTrue();

    $basic = Plan::query()->where('slug', 'basico')->firstOrFail();

    $this->actingAs(superAdminActor(), 'super_admin')
        ->put(route('super-admin.plans.update', $basic), planPayload(['name' => 'Básico', 'featured' => true]))
        ->assertRedirect(route('super-admin.plans.index'));

    expect($basic->fresh()->featured)->toBeTrue()
        ->and($pro->fresh()->featured)->toBeFalse();
});

test('a plan can be deactivated and drops out of the sign-up page', function () {
    $basic = Plan::query()->where('slug', 'basico')->firstOrFail();

    $this->actingAs(superAdminActor(), 'super_admin')
        ->put(route('super-admin.plans.update', $basic), planPayload(['name' => 'Básico', 'active' => false]));

    auth('super_admin')->logout();

    $this->get(route('register'))->assertInertia(fn ($page) => $page->has('plans', 2));
});

test('plan input is validated', function (array $overrides, string $field) {
    $this->actingAs(superAdminActor(), 'super_admin')
        ->post(route('super-admin.plans.store'), planPayload($overrides))
        ->assertSessionHasErrors($field);
})->with([
    'name required' => [['name' => ''], 'name'],
    'negative price' => [['price_cents' => -1], 'price_cents'],
    'unknown limit key' => [['limits' => ['max_stars' => 3]], 'limits'],
    'negative limit' => [['limits' => ['max_customers' => -5]], 'limits.max_customers'],
]);
