<?php

use App\Enums\BillingCycle;
use App\Enums\InvoiceStatus;
use App\Enums\OrganizationStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['billing.lead_days' => 5, 'billing.grace_days' => 7, 'billing.trial_days' => 7]);
});

test('creates a monthly invoice inside the lead window, once', function () {
    $subscription = Subscription::factory()->create(['current_period_end' => today()->addDays(3), 'price_cents' => 4990]);

    $this->artisan('billing:run')->assertSuccessful();
    $this->artisan('billing:run')->assertSuccessful();

    $invoice = SubscriptionInvoice::query()->sole();

    expect($invoice->subscription_id)->toBe($subscription->id)
        ->and($invoice->organization_id)->toBe($subscription->organization_id)
        ->and($invoice->amount_cents)->toBe(4990)
        ->and($invoice->due_date->toDateString())->toBe(today()->addDays(3)->toDateString())
        ->and($invoice->status)->toBe(InvoiceStatus::Open);
});

test('does not create an invoice before the lead window', function () {
    Subscription::factory()->create(['current_period_end' => today()->addDays(20)]);

    $this->artisan('billing:run');

    expect(SubscriptionInvoice::query()->count())->toBe(0);
});

test('annual subscriptions are charged the plan annual price', function () {
    $plan = Plan::factory()->create(['price_cents' => 2990, 'annual_price_cents' => 29900]);
    Subscription::factory()->create([
        'plan_id' => $plan->id,
        'billing_cycle' => BillingCycle::Annual,
        'current_period_end' => today()->addDay(),
    ]);

    $this->artisan('billing:run');

    expect(SubscriptionInvoice::query()->sole()->amount_cents)->toBe(29900);
});

test('a subscription without a period falls due after the trial', function () {
    $this->travelTo(now()->startOfDay());
    $subscription = Subscription::factory()->create(['current_period_end' => null]);

    $this->artisan('billing:run');
    expect(SubscriptionInvoice::query()->count())->toBe(0);

    $this->travel(3)->days();
    $this->artisan('billing:run');

    expect(SubscriptionInvoice::query()->sole()->due_date->toDateString())
        ->toBe($subscription->created_at->addDays(7)->toDateString());
});

test('canceled subscriptions are never billed', function () {
    Subscription::factory()->create(['status' => SubscriptionStatus::Canceled, 'canceled_at' => now(), 'current_period_end' => today()]);

    $this->artisan('billing:run');

    expect(SubscriptionInvoice::query()->count())->toBe(0);
});

test('an unpaid overdue invoice marks the subscription past due, without suspending inside the grace period', function () {
    $invoice = SubscriptionInvoice::factory()->create(['due_date' => today()->subDays(2)]);

    $this->artisan('billing:run');

    expect($invoice->subscription->fresh()->status)->toBe(SubscriptionStatus::PastDue)
        ->and($invoice->organization->fresh()->status)->toBe(OrganizationStatus::Active);
});

test('suspends the store once the grace period is over', function () {
    $invoice = SubscriptionInvoice::factory()->create(['due_date' => today()->subDays(8)]);

    $this->artisan('billing:run');

    $organization = $invoice->organization->fresh();

    expect($organization->status)->toBe(OrganizationStatus::Suspended)
        ->and($organization->suspension_reason)->toBe(Organization::BILLING_SUSPENSION_REASON);
});

test('a claimed invoice awaiting validation does not suspend the store', function () {
    $invoice = SubscriptionInvoice::factory()->claimed()->create(['due_date' => today()->subDays(30)]);

    $this->artisan('billing:run');

    expect($invoice->organization->fresh()->status)->toBe(OrganizationStatus::Active)
        ->and($invoice->subscription->fresh()->status)->toBe(SubscriptionStatus::PastDue);
});
