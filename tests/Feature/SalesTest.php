<?php

use App\Enums\PaymentMethod;
use App\Enums\SaleStatus;
use App\Enums\StockMovementReason;
use App\Models\Customer;
use App\Models\Installment;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\User;
use App\Support\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->organization = $this->user->organization;
    $this->customer = Customer::factory()->create(['organization_id' => $this->organization->id]);
    $this->product = Product::factory()->create(['organization_id' => $this->organization->id, 'price_cents' => 10000, 'stock_qty' => 5]);
});

afterEach(fn () => Tenant::forget());

function saleData(array $overrides = []): array
{
    return array_merge([
        'customer_id' => test()->customer->id,
        'items' => [['product_id' => test()->product->id, 'variant_id' => null, 'quantity' => 2]],
        'payment_type' => 'avista',
        'payment_method' => 'pix',
    ], $overrides);
}

test('cash sale decrements stock, logs the movement and is paid immediately', function () {
    $this->actingAs($this->user)->post(shopRoute('sales.store'), saleData())->assertSessionHasNoErrors();

    $sale = Sale::query()->firstOrFail();
    $installment = Installment::query()->firstOrFail();

    expect($sale->total_cents)->toBe(20000)
        ->and($this->product->fresh()->stock_qty)->toBe(3)
        ->and(StockMovement::query()->firstOrFail())->quantity_delta->toBe(-2)->reason->toBe(StockMovementReason::Sale)
        ->and($installment->remainingCents())->toBe(0)
        ->and(Payment::query()->firstOrFail()->method)->toBe(PaymentMethod::Pix);
});

test('fiado leaves one open installment 30 days out and requires a customer', function () {
    $this->actingAs($this->user)->post(shopRoute('sales.store'), saleData(['payment_type' => 'fiado']))->assertSessionHasNoErrors();

    $installment = Installment::query()->firstOrFail();

    expect($installment->remainingCents())->toBe(20000)
        ->and($installment->due_date->toDateString())->toBe(today()->addDays(30)->toDateString());

    $this->actingAs($this->user)->post(shopRoute('sales.store'), saleData(['payment_type' => 'fiado', 'customer_id' => null]))
        ->assertSessionHasErrors('customer_id');
});

test('parcelado splits the rest after the down payment and the last installment absorbs rounding', function () {
    $this->actingAs($this->user)->post(shopRoute('sales.store'), saleData([
        'payment_type' => 'parcelado',
        'installments' => 3,
        'down_payment_cents' => 1000,
        'first_due_date' => today()->addMonth()->toDateString(),
    ]))->assertSessionHasNoErrors();

    $installments = Installment::query()->orderBy('number')->get();

    expect($installments->pluck('number')->all())->toBe([0, 1, 2, 3])
        ->and($installments->pluck('amount_cents')->all())->toBe([1000, 6333, 6333, 6334])
        ->and($installments->sum('amount_cents'))->toBe(20000)
        ->and($installments[0]->remainingCents())->toBe(0)
        ->and($installments[1]->remainingCents())->toBe(6333);
});

test('a sale cannot exceed the available stock', function () {
    $this->actingAs($this->user)
        ->post(shopRoute('sales.store'), saleData(['items' => [['product_id' => $this->product->id, 'variant_id' => null, 'quantity' => 6]]]))
        ->assertSessionHasErrors('items.0.quantity');

    expect(Sale::query()->count())->toBe(0)->and($this->product->fresh()->stock_qty)->toBe(5);
});

test('selling a variant decrements the variant and the product total', function () {
    $variant = ProductVariant::factory()->create(['product_id' => $this->product->id, 'stock_qty' => 4, 'price_cents' => 12000]);
    $this->product->update(['stock_qty' => 4]);

    $this->actingAs($this->user)->post(shopRoute('sales.store'), saleData([
        'items' => [['product_id' => $this->product->id, 'variant_id' => $variant->id, 'quantity' => 1]],
    ]))->assertSessionHasNoErrors();

    expect($variant->fresh()->stock_qty)->toBe(3)
        ->and($this->product->fresh()->stock_qty)->toBe(3)
        ->and(Sale::query()->firstOrFail()->total_cents)->toBe(12000);
});

test('cancelling a sale returns stock and removes its money', function () {
    $this->actingAs($this->user)->post(shopRoute('sales.store'), saleData());
    $sale = Sale::query()->firstOrFail();

    $this->actingAs($this->user)->delete(shopRoute('sales.destroy', ['sale' => $sale]))->assertRedirect();

    expect($sale->fresh()->status)->toBe(SaleStatus::Cancelled)
        ->and($this->product->fresh()->stock_qty)->toBe(5)
        ->and(Installment::query()->count())->toBe(0)
        ->and(Payment::query()->count())->toBe(0)
        ->and(StockMovement::query()->where('reason', StockMovementReason::Return)->count())->toBe(1);
});

test('payments are limited to what is still owed', function () {
    $this->actingAs($this->user)->post(shopRoute('sales.store'), saleData(['payment_type' => 'fiado']));
    $installment = Installment::query()->firstOrFail();
    $url = shopRoute('installments.payments.store', ['installment' => $installment]);

    $this->actingAs($this->user)->post($url, ['amount_cents' => 20001, 'method' => 'cash'])->assertSessionHasErrors('amount_cents');
    $this->actingAs($this->user)->post($url, ['amount_cents' => 5000, 'method' => 'cash'])->assertSessionHasNoErrors();

    expect($installment->remainingCents())->toBe(15000);
});

test('the sales list reports settlement status per sale', function () {
    $this->actingAs($this->user)->post(shopRoute('sales.store'), saleData(['payment_type' => 'fiado']));
    Installment::query()->update(['due_date' => today()->subDays(3)->toDateString()]);

    $this->actingAs($this->user)->get(shopRoute('sales.index'))->assertInertia(fn (Assert $page) => $page
        ->component('sales/index')
        ->where('sales.0.status', 'overdue')
        ->where('sales.0.customer', $this->customer->name));
});

test('sales of another organization are not reachable', function () {
    $other = Organization::factory()->create();
    $sale = Sale::factory()->create(['organization_id' => $other->id]);

    $this->actingAs($this->user)->get(shopRoute('sales.show', ['sale' => $sale->id]))->assertNotFound();
    $this->actingAs($this->user)->delete(shopRoute('sales.destroy', ['sale' => $sale->id]))->assertNotFound();
});

test('home sums today sales, the month profit and what is owed', function () {
    $this->actingAs($this->user)->post(shopRoute('sales.store'), saleData());
    $this->actingAs($this->user)->post(shopRoute('sales.store'), saleData(['payment_type' => 'fiado']));
    Installment::query()->where('amount_cents', 20000)->whereDoesntHave('payments')->update(['due_date' => today()->toDateString()]);

    $this->actingAs($this->user)->get(shopRoute('dashboard'))->assertInertia(fn (Assert $page) => $page
        ->component('home')
        ->where('hasSales', true)
        ->where('salesTodayCents', 40000)
        ->where('monthProfitCents', 20000)
        ->where('receivableTodayCents', 20000)
        ->where('receivableOverdueCents', 0)
        ->has('owed', 1)
        ->where('owed.0.isOverdue', false));
});

test('home lists overdue installments among who owes me', function () {
    $this->actingAs($this->user)->post(shopRoute('sales.store'), saleData(['payment_type' => 'fiado']));
    Installment::query()->update(['due_date' => today()->subDay()->toDateString()]);

    $this->actingAs($this->user)->get(shopRoute('dashboard'))->assertInertia(fn (Assert $page) => $page
        ->has('owed', 1)
        ->where('owed.0.isOverdue', true)
        ->where('owed.0.dueDate', today()->subDay()->toDateString()));
});
