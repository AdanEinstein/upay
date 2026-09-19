<?php

use App\Auth\SuperAdminUser;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('the pulse dashboard is inaccessible without a super admin session', function () {
    $this->get('/'.config('pulse.path'))
        ->assertRedirect(route('super-admin.login'));
});

test('a super admin can view the pulse dashboard', function () {
    $superAdmin = new SuperAdminUser([
        'id' => config('super-admin.email'),
        'name' => config('super-admin.name'),
        'email' => config('super-admin.email'),
        'remember_token' => null,
    ]);

    $this->actingAs($superAdmin, 'super_admin')
        ->get('/'.config('pulse.path'))
        ->assertOk();
});
