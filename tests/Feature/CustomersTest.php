<?php

use App\Models\Customer;
use App\Models\Installment;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Sale;
use App\Models\Subscription;
use App\Models\User;
use App\Support\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->organization = $this->user->organization;
});

afterEach(fn () => Tenant::forget());

test('the balance is what was sold on credit minus what was paid', function () {
    $customer = Customer::factory()->create(['organization_id' => $this->organization->id]);
    $sale = Sale::factory()->create(['organization_id' => $this->organization->id, 'customer_id' => $customer->id]);
    $first = Installment::factory()->create(['sale_id' => $sale->id, 'amount_cents' => 10000]);
    Installment::factory()->create(['sale_id' => $sale->id, 'amount_cents' => 5000, 'number' => 2]);
    Payment::factory()->create(['installment_id' => $first->id, 'amount_cents' => 4000]);

    $this->actingAs($this->user)->get(shopRoute('customers.index'))->assertInertia(fn (Assert $page) => $page
        ->component('customers/index')
        ->where('customers.0.balanceCents', 11000));

    $this->actingAs($this->user)->get(shopRoute('customers.show', ['customer' => $customer->id]))->assertInertia(fn (Assert $page) => $page
        ->component('customers/show')
        ->where('customer.balanceCents', 11000)
        ->has('sales', 1));
});

test('creating a customer normalizes phone and document to digits', function () {
    $this->actingAs($this->user)->post(shopRoute('customers.store'), [
        'name' => 'Maria Souza',
        'phone' => '(11) 99999-0001',
        'document' => '123.456.789-09',
    ])->assertSessionHasNoErrors();

    $customer = Customer::query()->firstOrFail();

    expect($customer->phone)->toBe('11999990001')->and($customer->document)->toBe('12345678909');
});

test('creating from the sale flow returns to it with the customer selected', function () {
    $response = $this->actingAs($this->user)->post(shopRoute('customers.store'), ['name' => 'Ana', 'from' => 'sale']);

    $response->assertRedirect(shopRoute('sales.create', ['customer' => Customer::query()->firstOrFail()->id]));
});

test('the plan customer limit sends the user to the upgrade screen', function () {
    Subscription::factory()->create([
        'organization_id' => $this->organization->id,
        'plan_id' => Plan::factory()->create(['limits' => ['max_customers' => 1]])->id,
    ]);
    Customer::factory()->create(['organization_id' => $this->organization->id]);

    $this->actingAs($this->user)->get(shopRoute('customers.create'))->assertRedirect(shopRoute('plan-limit.show'));
    $this->actingAs($this->user)->post(shopRoute('customers.store'), ['name' => 'Another'])->assertRedirect(shopRoute('plan-limit.show'));

    expect(Customer::query()->count())->toBe(1);
});

test('customers of another organization are not reachable', function () {
    $foreign = Customer::factory()->create(['organization_id' => Organization::factory()->create()->id]);

    $this->actingAs($this->user)->get(shopRoute('customers.show', ['customer' => $foreign->id]))->assertNotFound();
    $this->actingAs($this->user)->put(shopRoute('customers.update', ['customer' => $foreign->id]), ['name' => 'x'])->assertNotFound();
});
