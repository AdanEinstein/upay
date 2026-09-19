<?php

use App\Auth\SuperAdminUser;
use App\Models\ErrorOccurrence;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function errorsSuperAdmin(): SuperAdminUser
{
    return new SuperAdminUser([
        'id' => config('super-admin.email'),
        'name' => config('super-admin.name'),
        'email' => config('super-admin.email'),
        'remember_token' => null,
    ]);
}

test('errors screen requires the super admin guard', function () {
    $this->get(route('super-admin.errors.index'))
        ->assertRedirect(route('super-admin.login'));

    $organization = Organization::factory()->create();
    $user = User::factory()->create(['organization_id' => $organization->id]);

    $this->actingAs($user)
        ->get(route('super-admin.errors.index'))
        ->assertRedirect(route('super-admin.login'));
});

test('super admin lists error occurrences with kpis', function () {
    ErrorOccurrence::factory()->count(2)->create();
    ErrorOccurrence::factory()->create(['created_at' => now()->subDays(3)]);

    $this->actingAs(errorsSuperAdmin(), 'super_admin')
        ->get(route('super-admin.errors.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('super/errors')
            ->has('occurrences.data', 3)
            ->where('kpis.last24h', 2)
            ->where('kpis.last7d', 3));
});

test('error occurrences can be filtered by status and organization', function () {
    $organization = Organization::factory()->create();

    ErrorOccurrence::factory()->create(['status' => 500, 'organization_id' => $organization->id]);
    ErrorOccurrence::factory()->create(['status' => 404, 'organization_id' => $organization->id]);
    ErrorOccurrence::factory()->create(['status' => 500]);

    $this->actingAs(errorsSuperAdmin(), 'super_admin')
        ->get(route('super-admin.errors.index', ['status' => 500]))
        ->assertInertia(fn ($page) => $page->has('occurrences.data', 2));

    $this->actingAs(errorsSuperAdmin(), 'super_admin')
        ->get(route('super-admin.errors.index', ['status' => 500, 'organization_id' => $organization->id]))
        ->assertInertia(fn ($page) => $page->has('occurrences.data', 1));
});
