<?php

use App\Auth\SuperAdminUser;
use App\Enums\OrganizationStatus;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function superAdminActor(): SuperAdminUser
{
    return new SuperAdminUser([
        'id' => config('super-admin.email'),
        'name' => config('super-admin.name'),
        'email' => config('super-admin.email'),
        'remember_token' => null,
    ]);
}

test('super admin can list organizations', function () {
    Organization::factory()->count(2)->create();

    $this->actingAs(superAdminActor(), 'super_admin')
        ->get(route('super-admin.organizations.index'))
        ->assertOk();
});

test('super admin can create an organization', function () {
    $response = $this->actingAs(superAdminActor(), 'super_admin')
        ->post(route('super-admin.organizations.store'), [
            'name' => 'Acme Inc.',
            'slug' => 'acme-inc',
        ]);

    $response->assertRedirect(route('super-admin.organizations.index'));

    $this->assertDatabaseHas('organizations', [
        'name' => 'Acme Inc.',
        'slug' => 'acme-inc',
        'status' => OrganizationStatus::Active->value,
    ]);
});

test('organization slug cannot be the reserved super-admin slug', function () {
    $response = $this->actingAs(superAdminActor(), 'super_admin')
        ->from(route('super-admin.organizations.create'))
        ->post(route('super-admin.organizations.store'), [
            'name' => 'Super Admin',
            'slug' => 'Super-Admin',
        ]);

    $response->assertSessionHasErrors('slug');
    $this->assertDatabaseMissing('organizations', ['slug' => 'super-admin']);
});

test('organization slug must be unique', function () {
    Organization::factory()->create(['slug' => 'acme-inc']);

    $response = $this->actingAs(superAdminActor(), 'super_admin')
        ->from(route('super-admin.organizations.create'))
        ->post(route('super-admin.organizations.store'), [
            'name' => 'Another Acme',
            'slug' => 'acme-inc',
        ]);

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

test('super admin can delete an organization', function () {
    $organization = Organization::factory()->create();

    $this->actingAs(superAdminActor(), 'super_admin')
        ->delete(route('super-admin.organizations.destroy', $organization))
        ->assertRedirect(route('super-admin.organizations.index'));

    $this->assertDatabaseMissing('organizations', ['id' => $organization->id]);
});

test('a suspended organization blocks tenant access', function () {
    $organization = Organization::factory()->create(['status' => OrganizationStatus::Suspended]);

    $this->get(route('login', ['organization' => $organization->slug]))
        ->assertNotFound();
});
