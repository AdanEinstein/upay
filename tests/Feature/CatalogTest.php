<?php

use App\Enums\NoticeType;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\ShopSetting;
use App\Models\User;
use App\Support\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    $this->user = User::factory()->create();
    $this->organization = $this->user->organization;
});

afterEach(fn () => Tenant::forget());

test('choosing an accent color derives the whole brand palette', function () {
    $this->actingAs($this->user)->post(shopRoute('catalog.identity.update'), [
        'name' => 'Loja da Ana',
        'accent_color' => '#16a34a',
        'welcome_text' => 'Oi!',
        'whatsapp' => '(11) 99999-0000',
        'logo' => UploadedFile::fake()->image('logo.png'),
        'cover' => UploadedFile::fake()->image('cover.png'),
    ])->assertSessionHasNoErrors();

    $organization = $this->organization->fresh();
    Tenant::use($organization);
    $settings = ShopSetting::query()->firstOrFail();

    expect($organization->name)->toBe('Loja da Ana')
        ->and($organization->accent_color_hover)->toBe('#12833b')
        ->and($organization->logo_path)->not->toBeNull()
        ->and($settings->whatsapp)->toBe('11999990000')
        ->and($settings->cover_path)->not->toBeNull();

    $this->actingAs($this->user)->post(shopRoute('catalog.identity.update'), ['name' => 'X', 'accent_color' => '#000000'])
        ->assertSessionHasErrors('accent_color');
});

test('picking a new accent color tells the merchant when the installed app follows', function () {
    $this->actingAs($this->user)
        ->post(shopRoute('catalog.identity.update'), ['name' => 'Loja da Ana', 'accent_color' => '#16a34a'])
        ->assertInertiaFlash('toast.message', 'O app instalado muda para a nova cor na próxima vez que for aberto. Pode levar até 1 dia, e o celular pode pedir para confirmar.');
});

test('keeping the accent color does not mention the installed app', function () {
    $this->organization->update(['accent_color' => '#16a34a']);

    $this->actingAs($this->user)
        ->post(shopRoute('catalog.identity.update'), ['name' => 'Loja da Ana', 'accent_color' => '#16a34a'])
        ->assertInertiaFlashMissing('toast');
});

test('an expired notice is not live', function () {
    Tenant::use($this->organization);
    $settings = ShopSetting::current();
    $settings->update(['notice_text' => 'Frete grátis', 'notice_active' => true, 'notice_type' => NoticeType::Warning, 'notice_expires_on' => today()->subDay()]);

    expect($settings->fresh()->hasLiveNotice())->toBeFalse();

    $settings->update(['notice_expires_on' => today()]);

    expect($settings->fresh()->hasLiveNotice())->toBeTrue();
});

test('the notice text is capped at 120 characters', function () {
    $this->actingAs($this->user)->put(shopRoute('catalog.notice.update'), ['notice_text' => str_repeat('a', 121), 'notice_type' => 'info', 'notice_active' => true])
        ->assertSessionHasErrors('notice_text');
});

test('promotions are split into active, scheduled and expired', function () {
    $products = Product::factory()->count(2)->create(['organization_id' => $this->organization->id]);

    $this->actingAs($this->user)->post(shopRoute('promotions.store'), ['product_ids' => $products->pluck('id')->all(), 'type' => 'percent', 'percent' => 20])->assertSessionHasNoErrors();
    $this->actingAs($this->user)->post(shopRoute('promotions.store'), ['product_ids' => [$products[0]->id], 'type' => 'percent', 'percent' => 10, 'starts_on' => today()->addDays(5)->toDateString()]);
    $this->actingAs($this->user)->post(shopRoute('promotions.store'), ['product_ids' => [$products[0]->id], 'type' => 'price', 'original_price_cents' => 1000, 'promo_price_cents' => 800, 'starts_on' => today()->subDays(9)->toDateString(), 'ends_on' => today()->subDay()->toDateString()]);

    $this->actingAs($this->user)->get(shopRoute('promotions.index'))->assertInertia(fn (Assert $page) => $page
        ->component('promotions/index')
        ->has('tabs.active', 1)
        ->has('tabs.scheduled', 1)
        ->has('tabs.expired', 1)
        ->where('tabs.active.0.productCount', 2));
});

test('a price promotion must be cheaper than the original price', function () {
    $product = Product::factory()->create(['organization_id' => $this->organization->id]);

    $this->actingAs($this->user)->post(shopRoute('promotions.store'), ['product_ids' => [$product->id], 'type' => 'price', 'original_price_cents' => 1000, 'promo_price_cents' => 1000])
        ->assertSessionHasErrors('promo_price_cents');
});

test('promotions cannot include products of another organization', function () {
    $foreign = Product::factory()->create();

    $this->actingAs($this->user)->post(shopRoute('promotions.store'), ['product_ids' => [$foreign->id], 'type' => 'percent', 'percent' => 20])
        ->assertSessionHasErrors('product_ids.0');
});

test('the preview only shows visible active products and live promotions', function () {
    Product::factory()->create(['organization_id' => $this->organization->id, 'name' => 'Visible']);
    Product::factory()->create(['organization_id' => $this->organization->id, 'name' => 'Hidden', 'catalog_visible' => false]);
    Product::factory()->inactive()->create(['organization_id' => $this->organization->id, 'name' => 'Inactive']);
    Promotion::factory()->create(['organization_id' => $this->organization->id, 'ends_on' => today()->subDay()]);

    $this->actingAs($this->user)->get(shopRoute('catalog.preview'))->assertInertia(fn (Assert $page) => $page
        ->component('catalog/preview')
        ->has('products', 1)
        ->where('products.0.name', 'Visible')
        ->has('promotions', 0)
        ->where('notice', null));
});

test('publishing the catalog and saving the pix key', function () {
    $this->actingAs($this->user)->put(shopRoute('catalog.publish'))->assertRedirect();
    $this->actingAs($this->user)->put(shopRoute('pix-key.update'), ['pix_key_type' => 'cpf', 'pix_key' => '123.456.789-09'])->assertSessionHasNoErrors();

    Tenant::use($this->organization);
    $settings = ShopSetting::query()->firstOrFail();

    expect($settings->catalog_public)->toBeTrue()->and($settings->pix_key)->toBe('12345678909');

    $this->actingAs($this->user)->get(shopRoute('more.show'))->assertInertia(fn (Assert $page) => $page->component('more')->where('pixKey', '12345678909'));
});

test('the more screen exposes the support whatsapp only when configured', function () {
    $this->actingAs($this->user)->get(shopRoute('more.show'))->assertInertia(fn (Assert $page) => $page->where('supportWhatsapp', null));

    config(['services.support.whatsapp' => '11999990000']);

    $this->actingAs($this->user)->get(shopRoute('more.show'))->assertInertia(fn (Assert $page) => $page->where('supportWhatsapp', '11999990000'));
});
