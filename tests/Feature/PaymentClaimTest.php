<?php

use App\Enums\ClaimStatus;
use App\Enums\PaymentMethod;
use App\Models\Customer;
use App\Models\Installment;
use App\Models\Payment;
use App\Models\PaymentClaim;
use App\Models\Sale;
use App\Models\User;
use App\Support\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');

    $this->user = User::factory()->create();
    $this->organization = $this->user->organization;
    $this->customer = Customer::factory()->create(['organization_id' => $this->organization->id]);
    $sale = Sale::factory()->create(['organization_id' => $this->organization->id, 'customer_id' => $this->customer->id, 'total_cents' => 15000]);
    $this->installment = Installment::factory()->create(['sale_id' => $sale->id, 'amount_cents' => 15000]);
});

afterEach(fn () => Tenant::forget());

function claimUrl(?Customer $customer = null, ?Installment $installment = null): string
{
    return route('public.debt.claim', [($customer ?? test()->customer)->public_token, ($installment ?? test()->installment)->id]);
}

test('customer notice creates a pending claim and never a payment', function () {
    $this->post(claimUrl())->assertRedirect();

    $claim = PaymentClaim::query()->withoutTenant()->sole();

    expect($claim->status)->toBe(ClaimStatus::Pending)
        ->and($claim->amount_cents)->toBe(15000)
        ->and($claim->receipt_path)->toBeNull()
        ->and(Payment::query()->withoutTenant()->count())->toBe(0);
});

test('a second notice for the same installment does not duplicate', function () {
    $this->post(claimUrl());
    $this->post(claimUrl());

    expect(PaymentClaim::query()->withoutTenant()->count())->toBe(1);
});

test('notice stores an optional receipt privately', function () {
    $this->post(claimUrl(), ['receipt' => UploadedFile::fake()->image('comprovante.png')])->assertSessionHasNoErrors();

    $claim = PaymentClaim::query()->withoutTenant()->sole();

    expect($claim->receipt_path)->toStartWith('receipts/'.$this->organization->id.'/');
    Storage::disk('local')->assertExists($claim->receipt_path);
});

test('notice rejects files that are not image or pdf, or too large', function () {
    $this->post(claimUrl(), ['receipt' => UploadedFile::fake()->create('virus.exe', 10)])->assertSessionHasErrors('receipt');
    $this->post(claimUrl(), ['receipt' => UploadedFile::fake()->create('big.pdf', 6000, 'application/pdf')])->assertSessionHasErrors('receipt');

    expect(PaymentClaim::query()->withoutTenant()->count())->toBe(0);
});

test('notice is refused for unknown token, other customer\'s installment and paid installments', function () {
    $this->post(route('public.debt.claim', ['nope', $this->installment->id]))->assertNotFound();

    $other = Customer::factory()->create();
    $this->post(claimUrl($other))->assertNotFound();

    Payment::factory()->create(['installment_id' => $this->installment->id, 'amount_cents' => 15000]);
    $this->post(claimUrl());

    expect(PaymentClaim::query()->withoutTenant()->count())->toBe(0);
});

test('public page flags installments with a pending notice', function () {
    $this->post(claimUrl());

    $this->withoutVite()->get(route('public.debt', $this->customer->public_token))
        ->assertInertia(fn (Assert $page) => $page->where('purchases.0.installments.0.claimPending', true));
});

test('shopkeeper confirms a claim into a pix payment once', function () {
    $claim = PaymentClaim::factory()->create(['installment_id' => $this->installment->id, 'amount_cents' => 15000]);

    $this->actingAs($this->user)->post(shopRoute('payment-claims.confirm', ['claim' => $claim->id]))->assertRedirect();
    $this->actingAs($this->user)->post(shopRoute('payment-claims.confirm', ['claim' => $claim->id]));

    $payment = Payment::query()->sole();

    expect($payment->method)->toBe(PaymentMethod::Pix)
        ->and($payment->amount_cents)->toBe(15000)
        ->and($this->installment->remainingCents())->toBe(0)
        ->and($claim->fresh()->status)->toBe(ClaimStatus::Confirmed);
});

test('shopkeeper rejects a claim without creating a payment', function () {
    $claim = PaymentClaim::factory()->create(['installment_id' => $this->installment->id]);

    $this->actingAs($this->user)->post(shopRoute('payment-claims.reject', ['claim' => $claim->id]))->assertRedirect();

    expect($claim->fresh()->status)->toBe(ClaimStatus::Rejected)
        ->and(Payment::query()->count())->toBe(0);
});

test('another store cannot resolve or read a claim', function () {
    $claim = PaymentClaim::factory()->create(['installment_id' => $this->installment->id, 'receipt_path' => 'receipts/x.png']);
    $stranger = User::factory()->create();

    $this->actingAs($stranger)->post(route('payment-claims.confirm', ['organization' => $stranger->organization->slug, 'claim' => $claim->id]))->assertNotFound();
    $this->actingAs($stranger)->get(route('payment-claims.receipt', ['organization' => $stranger->organization->slug, 'claim' => $claim->id]))->assertNotFound();

    expect($claim->fresh()->status)->toBe(ClaimStatus::Pending);
});

test('shopkeeper serves its own receipt and 404s when there is none', function () {
    Storage::disk('local')->put('receipts/a.png', 'img');
    $withReceipt = PaymentClaim::factory()->create(['installment_id' => $this->installment->id, 'receipt_path' => 'receipts/a.png']);
    $without = PaymentClaim::factory()->create(['installment_id' => $this->installment->id]);

    $this->actingAs($this->user)->get(shopRoute('payment-claims.receipt', ['claim' => $withReceipt->id]))->assertOk();
    $this->actingAs($this->user)->get(shopRoute('payment-claims.receipt', ['claim' => $without->id]))->assertNotFound();
});

test('sale page exposes the pending claim', function () {
    $claim = PaymentClaim::factory()->create(['installment_id' => $this->installment->id, 'receipt_path' => 'receipts/a.png']);

    $this->actingAs($this->user)->get(shopRoute('sales.show', ['sale' => $this->installment->sale_id]))
        ->assertInertia(fn (Assert $page) => $page->where('sale.installments.0.claim', ['id' => $claim->id, 'receiptType' => 'image']));
});

test('sale page tells the viewer whether the receipt is a pdf', function () {
    PaymentClaim::factory()->create(['installment_id' => $this->installment->id, 'receipt_path' => 'receipts/a.pdf']);

    $this->actingAs($this->user)->get(shopRoute('sales.show', ['sale' => $this->installment->sale_id]))
        ->assertInertia(fn (Assert $page) => $page->where('sale.installments.0.claim.receiptType', 'pdf'));
});
