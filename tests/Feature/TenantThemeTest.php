<?php

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('the login page renders the tenant accent color inline before any javascript runs', function () {
    $organization = Organization::factory()->create([
        'accent_color' => '#ff0044',
        'accent_color_hover' => '#cc0033',
        'accent_color_soft' => '#ffe6ec',
        'on_primary_color' => '#111111',
    ]);

    $response = $this->get(route('login', ['organization' => $organization->slug]));

    $response->assertOk();
    $response->assertSee('--tenant-primary:#ff0044', false);
    $response->assertSee('--tenant-primary-hover:#cc0033', false);
    $response->assertSee('--tenant-primary-soft:#ffe6ec', false);
    $response->assertSee('--tenant-on-primary:#111111', false);
});

test('two organizations render different accent colors on their dashboards', function () {
    $userA = User::factory()->for(Organization::factory()->state(['accent_color' => '#111111']), 'organization')->create();
    $userB = User::factory()->for(Organization::factory()->state(['accent_color' => '#222222']), 'organization')->create();

    $this->actingAs($userA)
        ->get(route('dashboard', ['organization' => $userA->organization->slug]))
        ->assertSee('--tenant-primary:#111111', false);

    $this->actingAs($userB)
        ->get(route('dashboard', ['organization' => $userB->organization->slug]))
        ->assertSee('--tenant-primary:#222222', false);
});
