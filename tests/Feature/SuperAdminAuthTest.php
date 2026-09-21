<?php

use App\Auth\SuperAdminUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

uses(RefreshDatabase::class);

test('super admin login screen can be rendered', function () {
    $this->get(route('super-admin.login'))->assertOk();
});

test('super admin can authenticate with the configured credentials', function () {
    config(['super-admin.email' => 'super@example.com', 'super-admin.password_hash' => Hash::make('secret-password')]);

    $response = $this->post(route('super-admin.login.store'), [
        'email' => 'super@example.com',
        'password' => 'secret-password',
    ]);

    $this->assertAuthenticated('super_admin');
    $response->assertRedirect(route('super-admin.dashboard'));
});

test('super admin cannot authenticate with the wrong password', function () {
    config(['super-admin.email' => 'super@example.com', 'super-admin.password_hash' => Hash::make('secret-password')]);

    $response = $this->from(route('super-admin.login'))->post(route('super-admin.login.store'), [
        'email' => 'super@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest('super_admin');
});

test('a regular tenant user cannot authenticate as super admin', function () {
    $user = User::factory()->create();

    config(['super-admin.email' => 'super@example.com', 'super-admin.password_hash' => Hash::make('secret-password')]);

    $this->post(route('super-admin.login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertGuest('super_admin');
});

test('super admin login is rate limited', function () {
    config(['super-admin.email' => 'super@example.com', 'super-admin.password_hash' => Hash::make('secret-password')]);

    RateLimiter::increment(md5('super-admin-login127.0.0.1'), amount: 5);

    $response = $this->post(route('super-admin.login.store'), [
        'email' => 'super@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertTooManyRequests();
});

test('super admin can log out', function () {
    $superAdmin = new SuperAdminUser([
        'id' => config('super-admin.email'),
        'name' => config('super-admin.name'),
        'email' => config('super-admin.email'),
        'remember_token' => null,
    ]);

    $response = $this->actingAs($superAdmin, 'super_admin')
        ->post(route('super-admin.logout'));

    $response->assertRedirect(route('super-admin.login'));
    $this->assertGuest('super_admin');
});

test('the organizations area requires super admin authentication', function () {
    $this->get(route('super-admin.organizations.index'))
        ->assertRedirect(route('super-admin.login'));
});
