<?php

use App\Enums\PixKeyType;
use App\Models\Organization;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ShopSetting;
use App\Models\User;
use App\Support\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

afterEach(fn () => Tenant::forget());

test('onboarding requires authentication and membership', function () {
    $user = User::factory()->create();
    $other = Organization::factory()->create();

    $this->get(route('onboarding.show', ['organization' => $user->organization->slug]))->assertRedirect();
    $this->actingAs($user)->get(route('onboarding.show', ['organization' => $other->slug]))->assertForbidden();
});

test('onboarding page is displayed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('onboarding.show', ['organization' => $user->organization->slug]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('onboarding')
            ->where('organization.name', $user->organization->name),
        );
});

test('onboarding saves identity, first product and pix key', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $slug = $user->organization->slug;

    $this->actingAs($user)
        ->post(route('onboarding.store', ['organization' => $slug]), [
            'name' => 'Loja da Ana',
            'logo' => UploadedFile::fake()->image('logo.png'),
            'product_name' => 'Batom Matte Rosé',
            'product_price_cents' => 3990,
            'product_photo' => UploadedFile::fake()->image('batom.jpg'),
            'pix_key_type' => 'email',
            'pix_key' => 'Maria@LojaDaAna.com.br',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('dashboard', ['organization' => $slug], absolute: false));

    $organization = $user->organization->fresh();
    Tenant::use($organization);

    $product = Product::query()->firstOrFail();

    expect($organization->name)->toBe('Loja da Ana')
        ->and($organization->logo_path)->not->toBeNull()
        ->and($product->name)->toBe('Batom Matte Rosé')
        ->and($product->price_cents)->toBe(3990)
        ->and(ProductImage::query()->where('product_id', $product->id)->count())->toBe(1)
        ->and(ShopSetting::query()->firstOrFail())
        ->pix_key_type->toBe(PixKeyType::Email)
        ->pix_key->toBe('maria@lojadaana.com.br');

    Storage::disk('public')->assertExists($organization->logo_path);
});

test('the identity and product steps can be skipped', function () {
    $user = User::factory()->create(['organization_id' => Organization::factory()->create(['name' => 'Minha Loja'])]);

    $this->actingAs($user)
        ->post(route('onboarding.store', ['organization' => $user->organization->slug]), [
            'pix_key_type' => 'cpf',
            'pix_key' => '123.456.789-09',
        ])
        ->assertSessionHasNoErrors();

    Tenant::use($user->organization->fresh());

    expect($user->organization->fresh()->name)->toBe('Minha Loja')
        ->and(Product::query()->count())->toBe(0)
        ->and(ShopSetting::query()->firstOrFail()->pix_key)->toBe('12345678909');
});

test('onboarding is validated', function (array $payload, string $field) {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('onboarding.store', ['organization' => $user->organization->slug]), $payload)
        ->assertSessionHasErrors($field);
})->with([
    'pix key is required' => [['pix_key_type' => 'email'], 'pix_key'],
    'pix key must match its type' => [['pix_key_type' => 'email', 'pix_key' => 'not-an-email'], 'pix_key'],
    'invalid cpf' => [['pix_key_type' => 'cpf', 'pix_key' => '123'], 'pix_key'],
    'product needs a price' => [['product_name' => 'Batom', 'pix_key_type' => 'random', 'pix_key' => 'abc'], 'product_price_cents'],
]);
