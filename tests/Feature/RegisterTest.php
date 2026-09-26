<?php

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function registrationPayload(array $overrides = []): array
{
    return [
        'name' => 'Maria Souza',
        'email' => 'Maria@LojaDaAna.com.br',
        'password' => 'senha-segura-123',
        'store_name' => 'Loja da Ana',
        'plan' => 'pro',
        ...$overrides,
    ];
}

test('register page lists the active plans by price', function () {
    $this->get(route('register'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/register')
            ->where('plans.0.slug', 'basico')
            ->where('plans.1.slug', 'pro')
            ->where('plans.1.priceCents', 4990)
            ->where('plans.1.maxCustomers', 500)
            ->where('plans.1.featured', true)
            ->where('plans.2.maxCustomers', null),
        );
});

test('a merchant can register a store and is sent to onboarding', function () {
    $response = $this->post(route('register.store'), registrationPayload());

    $user = User::query()->where('email', 'maria@lojadaana.com.br')->firstOrFail();
    $organization = $user->organization;

    $response->assertRedirect(route('onboarding.show', ['organization' => 'loja-da-ana'], absolute: false));
    $this->assertAuthenticatedAs($user);

    expect($organization->name)->toBe('Loja da Ana')
        ->and($organization->slug)->toBe('loja-da-ana')
        ->and($organization->subscription->plan->slug)->toBe('pro')
        ->and($organization->subscription->price_cents)->toBe(4990);
});

test('registering from the app loads onboarding as a full page so the store manifest is linked', function () {
    $this->withHeaders(['X-Inertia' => 'true'])
        ->post(route('register.store'), registrationPayload())
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', route('onboarding.show', ['organization' => 'loja-da-ana']));
});

test('the slug gets a numeric suffix when taken or reserved', function () {
    Organization::factory()->create(['slug' => 'loja-da-ana']);

    $this->post(route('register.store'), registrationPayload());
    expect(User::query()->where('email', 'maria@lojadaana.com.br')->first()->organization->slug)->toBe('loja-da-ana-2');

    auth()->logout();

    $this->post(route('register.store'), registrationPayload(['email' => 'outra@loja.com.br', 'store_name' => 'Super Admin']));
    expect(User::query()->where('email', 'outra@loja.com.br')->first()->organization->slug)->toBe('super-admin-2');
});

test('registration is validated', function (array $overrides, string $field) {
    User::factory()->create(['email' => 'maria@lojadaana.com.br']);

    $this->post(route('register.store'), registrationPayload($overrides))->assertSessionHasErrors($field);

    $this->assertGuest();
})->with([
    'duplicate email' => [[], 'email'],
    'unknown plan' => [['email' => 'nova@loja.com.br', 'plan' => 'gratis'], 'plan'],
    'missing store name' => [['email' => 'nova@loja.com.br', 'store_name' => ''], 'store_name'],
]);

test('inactive plans cannot be chosen', function () {
    DB::table('plans')->where('slug', 'pro')->update(['active' => false]);

    $this->post(route('register.store'), registrationPayload())->assertSessionHasErrors('plan');
});

test('authenticated users cannot open the register page', function () {
    $this->actingAs(User::factory()->create())->get(route('register'))->assertRedirect();
});
