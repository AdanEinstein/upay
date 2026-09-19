<?php

use App\Enums\Locale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('language settings page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('locale.edit', ['organization' => $user->organization->slug]))
        ->assertOk();
});

test('user can update their locale preference', function () {
    $user = User::factory()->create(['locale' => Locale::PtBr]);

    $response = $this->actingAs($user)
        ->from(route('locale.edit', ['organization' => $user->organization->slug]))
        ->put(route('locale.update', ['organization' => $user->organization->slug]), [
            'locale' => Locale::EnUs->value,
        ]);

    $response->assertSessionHasNoErrors();

    expect($user->refresh()->locale)->toBe(Locale::EnUs);
});

test('locale must be a valid enum value', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->from(route('locale.edit', ['organization' => $user->organization->slug]))
        ->put(route('locale.update', ['organization' => $user->organization->slug]), [
            'locale' => 'fr_FR',
        ]);

    $response->assertSessionHasErrors('locale');
});

test('the html lang attribute reflects the users saved locale preference', function () {
    $user = User::factory()->create(['locale' => Locale::EnUs]);

    $this->actingAs($user)
        ->get(route('dashboard', ['organization' => $user->organization->slug]))
        ->assertSee('lang="en-US"', false);
});
