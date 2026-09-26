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

test('logo and favicon can be removed', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $logo = UploadedFile::fake()->image('logo.png')->store('organizations/'.$user->organization->id, 'public');
    $favicon = UploadedFile::fake()->image('favicon.png')->store('organizations/'.$user->organization->id, 'public');
    $user->organization->forceFill(['logo_path' => $logo, 'favicon_path' => $favicon])->save();

    $this->actingAs($user)
        ->put(route('organization-settings.update', ['organization' => $user->organization->slug]), [
            'name' => $user->organization->name,
            'remove_logo' => '1',
            'remove_favicon' => '1',
            ...Organization::DEFAULT_COLORS,
        ])
        ->assertSessionHasNoErrors();

    $organization = $user->organization->fresh();

    expect($organization->logo_path)->toBeNull();
    expect($organization->favicon_path)->toBeNull();
    Storage::disk('public')->assertMissing([$logo, $favicon]);
});

test('a new upload wins over the remove flag', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->put(route('organization-settings.update', ['organization' => $user->organization->slug]), [
            'name' => $user->organization->name,
            'logo' => UploadedFile::fake()->image('logo.png'),
            'remove_logo' => '1',
            ...Organization::DEFAULT_COLORS,
        ])
        ->assertSessionHasNoErrors();

    expect($user->organization->fresh()->logo_path)->not->toBeNull();
});

test('the settings page exposes the default colors', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('organization-settings.edit', ['organization' => $user->organization->slug]))
        ->assertInertia(fn (Assert $page) => $page->where('defaultColors', Organization::DEFAULT_COLORS));
});

test('changing the brand color tells the merchant when the installed app follows', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put(route('organization-settings.update', ['organization' => $user->organization->slug]), [
            'name' => $user->organization->name,
            ...Organization::DEFAULT_COLORS,
            'accent_color' => '#16a34a',
        ])
        ->assertInertiaFlash('toast.message', 'Configurações da organização atualizadas.')
        ->assertInertiaFlash('toast.description', 'O app instalado muda para a nova cor na próxima vez que for aberto. Pode levar até 1 dia, e o celular pode pedir para confirmar.');
});

test('saving without changing the brand color does not mention the installed app', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put(route('organization-settings.update', ['organization' => $user->organization->slug]), [
            'name' => 'Acme Inc.',
            ...Organization::DEFAULT_COLORS,
        ])
        ->assertInertiaFlash('toast.message', 'Configurações da organização atualizadas.')
        ->assertInertiaFlashMissing('toast.description');
});
