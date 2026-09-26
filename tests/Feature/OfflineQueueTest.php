<?php

use App\Models\Customer;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Support\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->organization = $this->user->organization;
    $this->customer = Customer::factory()->create(['organization_id' => $this->organization->id]);
    $this->product = Product::factory()->create(['organization_id' => $this->organization->id, 'price_cents' => 10000, 'stock_qty' => 5]);
});

afterEach(fn () => Tenant::forget());

function queuedSale(array $overrides = []): array
{
    return array_merge([
        'customer_id' => test()->customer->id,
        'items' => [['product_id' => test()->product->id, 'variant_id' => null, 'quantity' => 2]],
        'payment_type' => 'avista',
        'payment_method' => 'pix',
    ], $overrides);
}

test('an action resent with the same idempotency key runs only once', function () {
    $key = (string) Str::uuid();

    $this->actingAs($this->user)->withHeader('Idempotency-Key', $key)->postJson(shopRoute('sales.store'), queuedSale())->assertRedirect();
    $this->actingAs($this->user)->withHeader('Idempotency-Key', $key)->postJson(shopRoute('sales.store'), queuedSale())->assertNoContent();

    expect(Sale::query()->count())->toBe(1)
        ->and($this->product->fresh()->stock_qty)->toBe(3);
});

test('a rejected attempt does not use up its idempotency key', function () {
    $key = (string) Str::uuid();

    $this->actingAs($this->user)->withHeader('Idempotency-Key', $key)
        ->postJson(shopRoute('sales.store'), queuedSale(['items' => [['product_id' => $this->product->id, 'variant_id' => null, 'quantity' => 9]]]))
        ->assertUnprocessable();

    $this->actingAs($this->user)->withHeader('Idempotency-Key', $key)->postJson(shopRoute('sales.store'), queuedSale())->assertRedirect();

    expect(Sale::query()->count())->toBe(1);
});

test('a malformed idempotency key is refused', function () {
    $this->actingAs($this->user)->withHeader('Idempotency-Key', 'not-a-uuid')->postJson(shopRoute('sales.store'), queuedSale())->assertBadRequest();

    expect(Sale::query()->count())->toBe(0);
});

test('a sale made offline is dated when it happened, not when it synced', function () {
    $occurredAt = now()->subHours(3)->startOfSecond();

    $this->actingAs($this->user)->postJson(shopRoute('sales.store'), queuedSale(['occurred_at' => $occurredAt->toIso8601String()]))->assertRedirect();

    expect(Sale::query()->firstOrFail()->sold_at->equalTo($occurredAt))->toBeTrue()
        ->and(Payment::query()->firstOrFail()->paid_at->equalTo($occurredAt))->toBeTrue();
});

test('an occurred_at in the future is refused', function () {
    $this->actingAs($this->user)->postJson(shopRoute('sales.store'), queuedSale(['occurred_at' => now()->addHour()->toIso8601String()]))
        ->assertJsonValidationErrors('occurred_at');
});

test('an expense paid offline is dated when it happened', function () {
    $expense = Expense::factory()->create(['organization_id' => $this->organization->id, 'paid_at' => null]);
    $occurredAt = now()->subDay()->startOfSecond();

    $this->actingAs($this->user)->postJson(shopRoute('expenses.pay', ['expense' => $expense->id]), ['occurred_at' => $occurredAt->toIso8601String()])->assertRedirect();

    expect($expense->fresh()->paid_at->equalTo($occurredAt))->toBeTrue();
});

test('the service worker is served as javascript with the build version', function () {
    $response = $this->get(route('service-worker'));

    $response->assertOk()->assertHeader('Content-Type', 'text/javascript; charset=utf-8');

    expect($response->getContent())->toStartWith('const VERSION = "')
        ->toContain('const ASSETS = [')
        ->toContain("self.addEventListener('fetch'");
});
