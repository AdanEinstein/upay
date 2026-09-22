<?php

use App\Enums\InvoiceStatus;
use App\Enums\OrganizationStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Organization;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function billingAs()
{
    return test()->actingAs(superAdminActor(), 'super_admin');
}

test('billing screen requires the super admin guard', function () {
    $this->get(route('super-admin.billing.index'))->assertRedirect(route('super-admin.login'));

    $invoice = SubscriptionInvoice::factory()->create();

    $this->post(route('super-admin.billing.approve', $invoice))->assertRedirect(route('super-admin.login'));
});

test('lists invoices waiting for validation first, with KPIs', function () {
    SubscriptionInvoice::factory()->claimed()->create();
    SubscriptionInvoice::factory()->create();
    SubscriptionInvoice::factory()->create(['due_date' => today()->subDay()]);
    SubscriptionInvoice::factory()->paid()->create(['amount_cents' => 5000]);

    billingAs()->get(route('super-admin.billing.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('super/billing')
            ->where('filters.filter', 'claimed')
            ->has('invoices.data', 1)
            ->where('kpis.claimed', 1)
            ->where('kpis.open', 2)
            ->where('kpis.overdue', 1)
            ->where('kpis.receivedMonthCents', 5000));

    billingAs()->get(route('super-admin.billing.index', ['filter' => 'all']))
        ->assertInertia(fn (Assert $page) => $page->has('invoices.data', 4)->where('invoices.data.0.status', 'claimed'));

    billingAs()->get(route('super-admin.billing.index', ['filter' => 'overdue']))
        ->assertInertia(fn (Assert $page) => $page->has('invoices.data', 1));
});

test('filters by store name', function () {
    $match = SubscriptionInvoice::factory()->create(['organization_id' => Organization::factory()->create(['name' => 'Loja Alfa'])->id, 'subscription_id' => Subscription::factory()->create()->id]);
    SubscriptionInvoice::factory()->create();

    billingAs()->get(route('super-admin.billing.index', ['filter' => 'all', 'q' => 'Alfa']))
        ->assertInertia(fn (Assert $page) => $page->has('invoices.data', 1)->where('invoices.data.0.id', $match->id));
});

test('approving renews the period, reactivates the subscription and lifts a billing suspension', function () {
    $subscription = Subscription::factory()->create(['status' => SubscriptionStatus::PastDue, 'current_period_end' => today()->subDays(10)]);
    $subscription->organization->update(['status' => OrganizationStatus::Suspended, 'suspension_reason' => Organization::BILLING_SUSPENSION_REASON]);
    $invoice = SubscriptionInvoice::factory()->claimed()->create(['subscription_id' => $subscription->id]);

    billingAs()->post(route('super-admin.billing.approve', $invoice))->assertRedirect();

    expect($invoice->fresh()->status)->toBe(InvoiceStatus::Paid)
        ->and($invoice->fresh()->paid_at)->not->toBeNull()
        ->and($subscription->fresh()->status)->toBe(SubscriptionStatus::Active)
        ->and($subscription->fresh()->current_period_end->toDateString())->toBe(today()->addMonth()->toDateString())
        ->and($subscription->organization->fresh()->status)->toBe(OrganizationStatus::Active)
        ->and($subscription->organization->fresh()->suspension_reason)->toBeNull();
});

test('approving an annual invoice adds twelve months on top of the current period', function () {
    $end = today()->addDays(3);
    $subscription = Subscription::factory()->create(['current_period_end' => $end]);
    $invoice = SubscriptionInvoice::factory()->create(['subscription_id' => $subscription->id, 'cycle' => 'annual']);

    billingAs()->post(route('super-admin.billing.approve', $invoice));

    expect($subscription->fresh()->current_period_end->toDateString())->toBe($end->copy()->addYear()->toDateString());
});

test('approving does not lift a manual suspension', function () {
    $subscription = Subscription::factory()->create();
    $subscription->organization->update(['status' => OrganizationStatus::Suspended, 'suspension_reason' => 'Abuse']);
    $invoice = SubscriptionInvoice::factory()->create(['subscription_id' => $subscription->id]);

    billingAs()->post(route('super-admin.billing.approve', $invoice));

    expect($subscription->organization->fresh()->status)->toBe(OrganizationStatus::Suspended);
});

test('approving is idempotent', function () {
    $subscription = Subscription::factory()->create(['current_period_end' => today()]);
    $invoice = SubscriptionInvoice::factory()->claimed()->create(['subscription_id' => $subscription->id]);

    billingAs()->post(route('super-admin.billing.approve', $invoice));
    billingAs()->post(route('super-admin.billing.approve', $invoice));

    expect($subscription->fresh()->current_period_end->toDateString())->toBe(today()->addMonth()->toDateString());
});

test('rejecting sends the invoice back to open with the reason', function () {
    $invoice = SubscriptionInvoice::factory()->claimed()->create();

    billingAs()->post(route('super-admin.billing.reject', $invoice), ['reason' => 'Valor não confere'])->assertRedirect();

    expect($invoice->fresh()->status)->toBe(InvoiceStatus::Open)
        ->and($invoice->fresh()->claimed_at)->toBeNull()
        ->and($invoice->fresh()->rejection_reason)->toBe('Valor não confere');
});

test('rejecting requires a reason', function () {
    $invoice = SubscriptionInvoice::factory()->claimed()->create();

    billingAs()->post(route('super-admin.billing.reject', $invoice))->assertSessionHasErrors('reason');

    expect($invoice->fresh()->status)->toBe(InvoiceStatus::Claimed);
});

test('streams the receipt privately and 404s without one', function () {
    Storage::fake('local');
    Storage::disk('local')->put('billing-receipts/1/proof.png', 'img');
    $with = SubscriptionInvoice::factory()->claimed()->create(['receipt_path' => 'billing-receipts/1/proof.png']);
    $without = SubscriptionInvoice::factory()->claimed()->create();

    billingAs()->get(route('super-admin.billing.receipt', $with))
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff');

    billingAs()->get(route('super-admin.billing.receipt', $without))->assertNotFound();
});
