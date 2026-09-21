<?php

use App\Enums\OrganizationStatus;
use App\Enums\SaleStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Customer;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\Sale;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function organizationPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Acme Inc.',
        'slug' => 'acme-inc',
        'admin_name' => 'Ana Admin',
        'admin_email' => 'ana@acme.test',
        'admin_password' => 'Sup3r-secret-pass',
        'admin_password_confirmation' => 'Sup3r-secret-pass',
    ], $overrides);
}

test('super admin can list organizations', function () {
    Organization::factory()->count(2)->create();
    Organization::factory()->suspended()->create();

    $this->actingAs(superAdminActor(), 'super_admin')
        ->get(route('super-admin.organizations.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super/organizations')
            ->has('organizations', 3)
            ->where('kpis.total', 3)
            ->where('kpis.active', 2)
            ->where('kpis.suspended', 1));
});

test('a tenant user cannot reach the super admin area', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->create(['organization_id' => $organization->id]);

    $this->actingAs($user)
        ->get(route('super-admin.organizations.index'))
        ->assertRedirect(route('super-admin.login'));
});

test('super admin can create an organization', function () {
    $response = $this->actingAs(superAdminActor(), 'super_admin')
        ->post(route('super-admin.organizations.store'), organizationPayload());

    $response->assertRedirect(route('super-admin.organizations.index'));

    $this->assertDatabaseHas('organizations', [
        'name' => 'Acme Inc.',
        'slug' => 'acme-inc',
        'status' => OrganizationStatus::Active->value,
    ]);
});

test('creating an organization provisions its first administrator', function () {
    $this->actingAs(superAdminActor(), 'super_admin')
        ->post(route('super-admin.organizations.store'), organizationPayload());

    $organization = Organization::where('slug', 'acme-inc')->firstOrFail();
    $admin = User::where('email', 'ana@acme.test')->firstOrFail();

    expect($admin->organization_id)->toBe($organization->id);
    expect($admin->name)->toBe('Ana Admin');
    expect(Hash::check('Sup3r-secret-pass', $admin->password))->toBeTrue();
});

test('administrator data is required and validated when creating an organization', function (array $overrides, string $field) {
    $this->actingAs(superAdminActor(), 'super_admin')
        ->post(route('super-admin.organizations.store'), organizationPayload($overrides))
        ->assertSessionHasErrors($field);

    $this->assertDatabaseMissing('organizations', ['slug' => 'acme-inc']);
})->with([
    'missing name' => [['admin_name' => ''], 'admin_name'],
    'invalid email' => [['admin_email' => 'not-an-email'], 'admin_email'],
    'unconfirmed password' => [['admin_password_confirmation' => 'different'], 'admin_password'],
]);

test('administrator email must be unique', function () {
    User::factory()->create(['email' => 'ana@acme.test']);

    $this->actingAs(superAdminActor(), 'super_admin')
        ->post(route('super-admin.organizations.store'), organizationPayload())
        ->assertSessionHasErrors('admin_email');

    $this->assertDatabaseMissing('organizations', ['slug' => 'acme-inc']);
});

test('organization slug cannot be the reserved super-admin slug', function () {
    $response = $this->actingAs(superAdminActor(), 'super_admin')
        ->from(route('super-admin.organizations.index'))
        ->post(route('super-admin.organizations.store'), organizationPayload([
            'name' => 'Super Admin',
            'slug' => 'Super-Admin',
        ]));

    $response->assertSessionHasErrors('slug');
    $this->assertDatabaseMissing('organizations', ['slug' => 'super-admin']);
});

test('organization slug must be unique', function () {
    Organization::factory()->create(['slug' => 'acme-inc']);

    $response = $this->actingAs(superAdminActor(), 'super_admin')
        ->from(route('super-admin.organizations.index'))
        ->post(route('super-admin.organizations.store'), organizationPayload(['name' => 'Another Acme']));

    $response->assertSessionHasErrors('slug');
});

test('super admin can update an organization', function () {
    $organization = Organization::factory()->create();

    $response = $this->actingAs(superAdminActor(), 'super_admin')
        ->put(route('super-admin.organizations.update', $organization), [
            'name' => 'Renamed',
            'slug' => $organization->slug,
            'status' => OrganizationStatus::Suspended->value,
        ]);

    $response->assertRedirect(route('super-admin.organizations.index'));

    expect($organization->refresh()->name)->toBe('Renamed');
    expect($organization->status)->toBe(OrganizationStatus::Suspended);
});

test('super admin can delete an organization along with its users', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->create(['organization_id' => $organization->id]);

    $this->actingAs(superAdminActor(), 'super_admin')
        ->delete(route('super-admin.organizations.destroy', $organization))
        ->assertRedirect(route('super-admin.organizations.index'));

    $this->assertDatabaseMissing('organizations', ['id' => $organization->id]);
    $this->assertDatabaseMissing('users', ['id' => $user->id]);
});

test('a suspended organization blocks tenant access', function () {
    $organization = Organization::factory()->create(['status' => OrganizationStatus::Suspended]);

    $this->get(route('login', ['organization' => $organization->slug]))
        ->assertNotFound();
});

test('the organizations list exposes plan, owner, usage and past due state', function () {
    $organization = Organization::factory()->create();
    $owner = User::factory()->create(['organization_id' => $organization->id]);
    $plan = Plan::query()->where('slug', 'pro')->firstOrFail();
    Subscription::factory()->for($organization)->create([
        'plan_id' => $plan->id,
        'status' => SubscriptionStatus::PastDue,
    ]);
    Customer::factory()->count(2)->create(['organization_id' => $organization->id]);
    Sale::factory()->create(['organization_id' => $organization->id, 'customer_id' => null, 'sold_at' => now(), 'status' => SaleStatus::Completed]);
    Sale::factory()->create(['organization_id' => $organization->id, 'customer_id' => null, 'sold_at' => now()->subMonths(2), 'status' => SaleStatus::Completed]);

    $this->actingAs(superAdminActor(), 'super_admin')
        ->get(route('super-admin.organizations.index'))
        ->assertInertia(fn ($page) => $page
            ->where('organizations.0.plan.name', 'Profissional')
            ->where('organizations.0.pastDue', true)
            ->where('organizations.0.owner.email', $owner->email)
            ->where('organizations.0.customersCount', 2)
            ->where('organizations.0.salesMonthCount', 1)
            ->where('kpis.pastDue', 1)
            ->has('plans', 3));
});

test('super admin blocks an organization with a reason and reactivates it', function () {
    $organization = Organization::factory()->create();

    $this->actingAs(superAdminActor(), 'super_admin')
        ->put(route('super-admin.organizations.status.update', $organization), ['status' => 'suspended', 'reason' => 'Pagamento em atraso'])
        ->assertRedirect(route('super-admin.organizations.index'));

    expect($organization->fresh())
        ->status->toBe(OrganizationStatus::Suspended)
        ->suspension_reason->toBe('Pagamento em atraso');

    $this->put(route('super-admin.organizations.status.update', $organization), ['status' => 'active']);

    expect($organization->fresh())
        ->status->toBe(OrganizationStatus::Active)
        ->suspension_reason->toBeNull();
});

test('super admin changes an organization plan and the subscription is re-priced', function () {
    $organization = Organization::factory()->create();
    $basic = Plan::query()->where('slug', 'basico')->firstOrFail();
    $advanced = Plan::query()->where('slug', 'avancado')->firstOrFail();

    $this->actingAs(superAdminActor(), 'super_admin');

    $this->put(route('super-admin.organizations.subscription.update', $organization), ['plan_id' => $basic->id])
        ->assertRedirect(route('super-admin.organizations.index'));
    expect($organization->fresh()->subscription->price_cents)->toBe(2990);

    $this->put(route('super-admin.organizations.subscription.update', $organization), ['plan_id' => $advanced->id]);

    expect($organization->fresh()->subscription)
        ->plan_id->toBe($advanced->id)
        ->price_cents->toBe(8990)
        ->and(Subscription::query()->count())->toBe(1);
});

test('an inactive or unknown plan cannot be assigned', function () {
    $organization = Organization::factory()->create();
    $inactive = Plan::factory()->create(['active' => false]);

    $this->actingAs(superAdminActor(), 'super_admin')
        ->put(route('super-admin.organizations.subscription.update', $organization), ['plan_id' => $inactive->id])
        ->assertSessionHasErrors('plan_id');
});
