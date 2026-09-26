<?php

use App\Enums\PromotionType;
use App\Models\Organization;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\ShopSetting;
use App\Support\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

afterEach(fn () => Tenant::forget());

function publishedStore(bool $published = true, string $slug = 'loja-da-ana'): Organization
{
    $organization = Organization::factory()->create(['name' => 'Loja da Ana', 'slug' => $slug]);
    ShopSetting::factory()->create(['organization_id' => $organization->id, 'catalog_public' => $published, 'whatsapp' => '11999990000']);

    return $organization;
}

it('serves the published catalog without login and defers the products', function () {
    $organization = publishedStore();
    $visible = Product::factory()->create(['organization_id' => $organization->id, 'name' => 'Vestido', 'price_cents' => 10000, 'catalog_visible' => true, 'active' => true]);
    Product::factory()->create(['organization_id' => $organization->id, 'name' => 'Escondido', 'catalog_visible' => false, 'active' => true]);
    Product::factory()->create(['organization_id' => $organization->id, 'name' => 'Inativo', 'catalog_visible' => true, 'active' => false]);
    Product::factory()->create(['name' => 'De outra loja', 'catalog_visible' => true, 'active' => true]);
    ProductVariant::factory()->create(['organization_id' => $organization->id, 'product_id' => $visible->id, 'name' => 'M', 'stock_qty' => 0]);

    $this->withoutVite()->get(route('public.catalog', 'loja-da-ana'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/catalog')
            ->where('store.slug', 'loja-da-ana')
            ->where('store.name', 'Loja da Ana')
            ->missing('products')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('products', 1)
                ->where('products.0.name', 'Vestido')
                ->where('products.0.variants.0.inStock', false)));
});

it('applies an active promotion to the price', function () {
    $organization = publishedStore();
    $product = Product::factory()->create(['organization_id' => $organization->id, 'price_cents' => 10000, 'catalog_visible' => true, 'active' => true]);
    $promotion = Promotion::factory()->create(['organization_id' => $organization->id, 'type' => PromotionType::Percent, 'percent' => 20, 'promo_price_cents' => null, 'starts_on' => null, 'ends_on' => null]);
    $promotion->products()->attach($product);

    $this->withoutVite()->get(route('public.catalog', 'loja-da-ana'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload->where('products.0.promoPriceCents', 8000)));
});

it('shows an unavailable page for an unpublished, suspended or unknown store', function () {
    publishedStore(published: false);
    publishedStore(slug: 'suspensa')->update(['status' => 'suspended']);

    foreach (['loja-da-ana', 'suspensa', 'nao-existe'] as $slug) {
        $this->withoutVite()->get(route('public.catalog', $slug))
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page->component('public/catalog-unavailable'));
    }
});

it('does not let an organization take the catalog or debt prefixes as a slug', function () {
    expect(Organization::uniqueSlugFor('C'))->not->toBe('c')
        ->and(Organization::uniqueSlugFor('P'))->not->toBe('p');
});
