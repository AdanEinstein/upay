<?php

use App\Auth\SuperAdminUser;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('pages carry a nonce-locked script policy that matches the inline scripts', function () {
    $response = $this->get(route('home'))->assertOk();

    $policy = $response->headers->get('Content-Security-Policy');
    preg_match("/script-src 'self' 'nonce-([^']+)'/", (string) $policy, $match);

    expect($match)->not->toBeEmpty()
        ->and($policy)->toContain("frame-ancestors 'self'")
        ->and($policy)->toContain("object-src 'none'")
        ->and($policy)->not->toContain('unsafe-eval');

    $response->assertSee('<script nonce="'.$match[1].'">', false);
});

test('each request gets a fresh nonce', function () {
    $first = $this->get(route('home'))->headers->get('Content-Security-Policy');
    $second = $this->get(route('home'))->headers->get('Content-Security-Policy');

    expect($first)->not->toBe($second);
});

test('the pulse dashboard is left without a policy', function () {
    $superAdmin = new SuperAdminUser([
        'id' => config('super-admin.email'),
        'name' => config('super-admin.name'),
        'email' => config('super-admin.email'),
        'remember_token' => null,
    ]);

    $this->actingAs($superAdmin, 'super_admin')
        ->get('/'.config('pulse.path'))
        ->assertOk()
        ->assertHeaderMissing('Content-Security-Policy');
});
