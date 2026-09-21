<?php

use App\Enums\PixKeyType;
use App\Models\Customer;
use App\Models\Installment;
use App\Models\Organization;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\ShopSetting;
use App\Support\PixPayload;
use App\Support\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

afterEach(fn () => Tenant::forget());

function debtFixture(): array
{
    $organization = Organization::factory()->create(['name' => 'Loja da Ana']);
    ShopSetting::factory()->create(['organization_id' => $organization->id, 'pix_key' => 'ana@loja.com', 'pix_key_type' => PixKeyType::Email]);
    $customer = Customer::factory()->create(['organization_id' => $organization->id]);
    $sale = Sale::factory()->create(['organization_id' => $organization->id, 'customer_id' => $customer->id, 'total_cents' => 30000]);
    $first = Installment::factory()->create(['sale_id' => $sale->id, 'number' => 1, 'amount_cents' => 15000, 'due_date' => now()->subMonth()->toDateString()]);
    $second = Installment::factory()->create(['sale_id' => $sale->id, 'number' => 2, 'amount_cents' => 15000, 'due_date' => now()->subDay()->toDateString()]);
    Payment::factory()->create(['installment_id' => $first->id, 'amount_cents' => 15000]);
    Payment::factory()->create(['installment_id' => $second->id, 'amount_cents' => 5000]);

    return [$customer, $second];
}

it('shows the customer their purchases, balance and PIX for what is still owed', function () {
    [$customer] = debtFixture();

    $this->withoutVite()->get(route('public.debt', $customer->public_token))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/debt')
            ->where('store', 'Loja da Ana')
            ->where('openCents', 10000)
            ->where('purchases.0.paidCents', 20000)
            ->where('purchases.0.status', 'overdue')
            ->where('purchases.0.installments.0.status', 'paid')
            ->where('purchases.0.installments.0.pixCode', null)
            ->where('purchases.0.installments.1.remainingCents', 10000)
            ->where('purchases.0.installments.1.status', 'overdue')
            ->where('purchases.0.installments.1.pixCode', fn ($code) => str_contains($code, 'ana@loja.com') && str_contains($code, '5406100.00'))
            ->has('purchases.0.installments.1.pixQr'));
});

it('does not leak another store\'s data through a token', function () {
    [$customer] = debtFixture();
    $other = Customer::factory()->create();
    Sale::factory()->create(['organization_id' => $other->organization_id, 'customer_id' => $other->id, 'total_cents' => 99900]);

    $this->withoutVite()->get(route('public.debt', $customer->public_token))
        ->assertInertia(fn (Assert $page) => $page->has('purchases', 1)->where('purchases.0.totalCents', 30000));
});

it('reports zero owed when everything is paid', function () {
    [$customer, $second] = debtFixture();
    Payment::factory()->create(['installment_id' => $second->id, 'amount_cents' => 10000]);

    $this->withoutVite()->get(route('public.debt', $customer->public_token))
        ->assertInertia(fn (Assert $page) => $page->where('openCents', 0)->where('purchases.0.status', 'paid'));
});

it('gives a 404 invalid-link page for an unknown token', function () {
    $this->withoutVite()->get(route('public.debt', 'nope'))
        ->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page->component('public/invalid'));
});

it('does not serve a suspended store', function () {
    [$customer] = debtFixture();
    $customer->organization->update(['status' => 'suspended']);

    $this->withoutVite()->get(route('public.debt', $customer->public_token))->assertNotFound();
});

it('builds a PIX payload with a valid CRC16', function () {
    $crc = new ReflectionMethod(PixPayload::class, 'crc16');

    expect($crc->invoke(null, '123456789'))->toBe('29B1');

    $payload = PixPayload::make(PixKeyType::Phone, '(11) 99999-0001', 'Loja da Ana', 1234);

    expect($payload)->toStartWith('000201')
        ->and($payload)->toContain('+5511999990001')
        ->and($payload)->toContain('540512.34')
        ->and($crc->invoke(null, substr($payload, 0, -4)))->toBe(substr($payload, -4));
});
