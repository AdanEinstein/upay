<?php

use App\Enums\StockMovementReason;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\StockMovement;
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

test('a product with variants keeps the total stock as the sum of its variants', function () {
    $this->actingAs($this->user)->post(shopRoute('products.store'), [
        'name' => 'Batom',
        'price_cents' => 3990,
        'cost_cents' => 1800,
        'category' => 'Maquiagem',
        'variants' => [['name' => 'Rosé', 'stock_qty' => 8], ['name' => 'Nude', 'stock_qty' => 2]],
        'photos' => [UploadedFile::fake()->image('a.jpg')],
    ])->assertSessionHasNoErrors();

    $product = Product::query()->firstOrFail();

    expect($product->stock_qty)->toBe(10)
        ->and($product->variants()->count())->toBe(2)
        ->and(ProductImage::query()->count())->toBe(1)
        ->and(StockMovement::query()->sum('quantity_delta'))->toBe(10);
});

test('editing stock records the delta as an adjustment', function () {
    $product = Product::factory()->create(['organization_id' => $this->organization->id, 'stock_qty' => 5]);

    $this->actingAs($this->user)->put(shopRoute('products.update', ['product' => $product->id]), [
        'name' => $product->name,
        'price_cents' => $product->price_cents,
        'stock_qty' => 3,
    ])->assertSessionHasNoErrors();

    expect($product->fresh()->stock_qty)->toBe(3)
        ->and(StockMovement::query()->firstOrFail())->quantity_delta->toBe(-2)->reason->toBe(StockMovementReason::Adjustment);
});

test('removing a variant while editing deletes it and recomputes the total', function () {
    $product = Product::factory()->create(['organization_id' => $this->organization->id, 'stock_qty' => 9]);
    $keep = ProductVariant::factory()->create(['product_id' => $product->id, 'stock_qty' => 4]);
    ProductVariant::factory()->create(['product_id' => $product->id, 'stock_qty' => 5]);

    $this->actingAs($this->user)->put(shopRoute('products.update', ['product' => $product->id]), [
        'name' => $product->name,
        'price_cents' => $product->price_cents,
        'variants' => [['id' => $keep->id, 'name' => 'Only', 'stock_qty' => 4]],
    ])->assertSessionHasNoErrors();

    expect($product->variants()->count())->toBe(1)->and($product->fresh()->stock_qty)->toBe(4);
});

test('at most four photos per product', function () {
    $photos = array_map(fn ($n) => UploadedFile::fake()->image("$n.jpg"), range(1, 5));

    $this->actingAs($this->user)->post(shopRoute('products.store'), ['name' => 'X', 'price_cents' => 100, 'photos' => $photos])
        ->assertSessionHasErrors('photos');
});

test('accepts phone-sized photos up to 10 MB', function () {
    $this->actingAs($this->user)->post(shopRoute('products.store'), ['name' => 'X', 'price_cents' => 100, 'photos' => [UploadedFile::fake()->image('a.jpg')->size(8000)]])
        ->assertSessionHasNoErrors();

    $this->actingAs($this->user)->post(shopRoute('products.store'), ['name' => 'Y', 'price_cents' => 100, 'photos' => [UploadedFile::fake()->image('b.jpg')->size(10241)]])
        ->assertSessionHasErrors('photos.0');
});

test('restocking a variant raises both the variant and the product', function () {
    $product = Product::factory()->create(['organization_id' => $this->organization->id, 'stock_qty' => 4]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'stock_qty' => 4]);

    $this->actingAs($this->user)->post(shopRoute('products.stock.store', ['product' => $product->id]), ['quantity' => 6, 'variant_id' => $variant->id])
        ->assertSessionHasNoErrors();

    expect($variant->fresh()->stock_qty)->toBe(10)->and($product->fresh()->stock_qty)->toBe(10);

    $this->actingAs($this->user)->get(shopRoute('products.show', ['product' => $product->id]))->assertInertia(fn (Assert $page) => $page
        ->component('products/show')
        ->where('movements.0.delta', 6));
});
