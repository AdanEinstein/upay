<?php

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('organization settings page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('organization-settings.edit', ['organization' => $user->organization->slug]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/organization-settings')
            ->where('organization.name', $user->organization->name),
        );
});

test('organization settings can be updated', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->from(route('organization-settings.edit', ['organization' => $user->organization->slug]))
        ->put(route('organization-settings.update', ['organization' => $user->organization->slug]), [
            'name' => 'Acme Inc.',
            'logo' => UploadedFile::fake()->image('logo.png'),
            'accent_color' => '#123456',
            'accent_color_hover' => '#123456',
            'accent_color_soft' => '#123456',
            'on_primary_color' => '#ffffff',
        ]);

    $response->assertSessionHasNoErrors();

    $organization = $user->organization->fresh();

    expect($organization->name)->toBe('Acme Inc.');
    expect($organization->accent_color)->toBe('#123456');
    expect($organization->logo_path)->not->toBeNull();
    Storage::disk('public')->assertExists($organization->logo_path);
});

test('users cannot update another organizations settings', function () {
    $user = User::factory()->create();
    $otherOrganization = Organization::factory()->create();

    $this->actingAs($user)
        ->get(route('organization-settings.edit', ['organization' => $otherOrganization->slug]))
        ->assertForbidden();
});
