<?php

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Installment;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\ShopSetting;
use App\Models\StockMovement;
use App\Support\Tenant;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

afterEach(fn () => Tenant::forget());

it('keeps child records in the same organization as their parent', function () {
    $payment = Payment::factory()->create();
    $installment = $payment->installment()->withoutTenant()->first();
    $sale = $installment->sale()->withoutTenant()->first();

    expect($payment->organization_id)->toBe($installment->organization_id)
        ->and($installment->organization_id)->toBe($sale->organization_id)
        ->and($sale->customer()->withoutTenant()->first()->organization_id)->toBe($sale->organization_id)
        ->and($installment->customer_id)->toBe($sale->customer_id);

    $item = SaleItem::factory()->for($sale)->create();
    $variant = ProductVariant::factory()->create();
    $image = ProductImage::factory()->create();
    $movement = StockMovement::factory()->create();

    expect($item->organization_id)->toBe($sale->organization_id)
        ->and($variant->organization_id)->toBe($variant->product()->withoutTenant()->first()->organization_id)
        ->and($image->organization_id)->toBe($image->product()->withoutTenant()->first()->organization_id)
        ->and($movement->organization_id)->toBe($movement->product()->withoutTenant()->first()->organization_id);
});

it('scopes every tenant model to the active organization and fills organization_id on create', function (string $model) {
    $mine = Organization::factory()->create();
    $other = Organization::factory()->create();
    $model::factory()->create(['organization_id' => $mine->id]);
    $model::factory()->create(['organization_id' => $other->id]);

    Tenant::use($mine);

    expect($model::query()->pluck('organization_id')->all())->toBe([$mine->id])
        ->and($model::query()->withoutTenant()->count())->toBe(2);
})->with([
    Customer::class,
    Product::class,
    Sale::class,
    Expense::class,
    ShopSetting::class,
]);

it('assigns the active tenant to records created without an organization', function () {
    $organization = Organization::factory()->create();
    Tenant::use($organization);

    $customer = Customer::create(['name' => 'Maria Souza']);

    expect($customer->organization_id)->toBe($organization->id);
});

it('generates a unique 40-char public token for each customer', function () {
    $customers = Customer::factory()->count(2)->create();

    expect($customers[0]->public_token)->toHaveLength(40)
        ->and($customers[0]->public_token)->not->toBe($customers[1]->public_token);
});

it('rejects a second installment with the same number for a sale', function () {
    $installment = Installment::factory()->create();

    Installment::factory()->for($installment->sale()->withoutTenant()->first())->create(['number' => 1]);
})->throws(QueryException::class);
