<?php

use App\Enums\InvoiceStatus;
use App\Enums\OrganizationStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Customer;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Models\User;
use App\Support\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
    config(['billing.pix_key' => 'pay@upay.test', 'billing.pix_key_type' => 'email']);

    $this->user = User::factory()->create();
    $this->organization = $this->user->organization;
    $this->subscription = Subscription::factory()->create(['organization_id' => $this->organization->id]);
    $this->invoice = SubscriptionInvoice::factory()->create(['subscription_id' => $this->subscription->id, 'amount_cents' => 2990]);
});

afterEach(fn () => Tenant::forget());

test('shows the current invoice with the platform PIX code', function () {
    $this->actingAs($this->user)
        ->get(shopRoute('billing.show'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('billing/show')
            ->where('current.id', $this->invoice->id)
            ->where('current.amountCents', 2990)
            ->where('current.pixCode', fn (string $code) => str_contains($code, 'pay@upay.test'))
            ->whereType('current.pixQr', 'string'));
});

test('shows no PIX code when the platform key is not configured', function () {
    config(['billing.pix_key' => null]);

    $this->actingAs($this->user)
        ->get(shopRoute('billing.show'))
        ->assertInertia(fn (Assert $page) => $page->where('current.pixCode', null)->where('current.pixQr', null));
});

test('claiming payment without a receipt moves the invoice to claimed', function () {
    $this->actingAs($this->user)
        ->post(shopRoute('billing.claim', ['invoice' => $this->invoice->id]))
        ->assertRedirect();

    $invoice = $this->invoice->fresh();

    expect($invoice->status)->toBe(InvoiceStatus::Claimed)
        ->and($invoice->claimed_at)->not->toBeNull()
        ->and($invoice->receipt_path)->toBeNull();
});

test('claiming payment flashes a toast translated to the user locale', function () {
    $this->actingAs($this->user)
        ->post(shopRoute('billing.claim', ['invoice' => $this->invoice->id]))
        ->assertInertiaFlash('toast.message', 'Aviso de pagamento enviado. Vamos confirmar em breve.');
});

test('claiming payment stores the optional receipt privately', function () {
    $this->actingAs($this->user)
        ->post(shopRoute('billing.claim', ['invoice' => $this->invoice->id]), ['receipt' => UploadedFile::fake()->image('proof.png')])
        ->assertSessionHasNoErrors();

    Storage::disk('local')->assertExists($this->invoice->fresh()->receipt_path);
});

test('rejects receipts with a wrong type or size', function (UploadedFile $file) {
    $this->actingAs($this->user)
        ->post(shopRoute('billing.claim', ['invoice' => $this->invoice->id]), ['receipt' => $file])
        ->assertSessionHasErrors('receipt');

    expect($this->invoice->fresh()->status)->toBe(InvoiceStatus::Open);
})->with([
    'wrong type' => fn () => UploadedFile::fake()->create('proof.exe', 10),
    'too big' => fn () => UploadedFile::fake()->create('big.pdf', 6000, 'application/pdf'),
]);

test('an already claimed invoice cannot be claimed again', function () {
    $this->invoice->update(['status' => InvoiceStatus::Claimed]);

    $this->actingAs($this->user)
        ->post(shopRoute('billing.claim', ['invoice' => $this->invoice->id]))
        ->assertUnprocessable();
});

test('a store cannot claim another store invoice', function () {
    $other = SubscriptionInvoice::factory()->create();

    $this->actingAs($this->user)
        ->post(shopRoute('billing.claim', ['invoice' => $other->id]))
        ->assertNotFound();

    expect($other->fresh()->status)->toBe(InvoiceStatus::Open);
});

test('a store suspended for non-payment can still reach billing but is redirected elsewhere', function () {
    $this->organization->update(['status' => OrganizationStatus::Suspended]);
    $this->subscription->update(['status' => SubscriptionStatus::PastDue]);

    $this->actingAs($this->user)
        ->get(shopRoute('billing.show'))
        ->assertOk();

    $this->actingAs($this->user)
        ->get(shopRoute('dashboard'))
        ->assertRedirect(shopRoute('billing.show'));
});

test('a store suspended manually still gets a 404', function () {
    $this->organization->update(['status' => OrganizationStatus::Suspended]);

    $this->actingAs($this->user)
        ->get(shopRoute('dashboard'))
        ->assertNotFound();
});

test('the unpaid invoice is shared with every shop page as a banner prop', function () {
    $this->actingAs($this->user)
        ->get(shopRoute('more.show'))
        ->assertInertia(fn (Assert $page) => $page->where('billing.dueDate', $this->invoice->due_date->toDateString()));
});

test('exposes the plan status with the period derived from the billing cycle', function () {
    $this->subscription->update(['current_period_end' => today()->addDays(10)]);

    $this->actingAs($this->user)
        ->get(shopRoute('billing.show'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('subscription.status', 'active')
            ->where('subscription.trial', false)
            ->where('subscription.daysLeft', 10)
            ->where('subscription.periodEnd', today()->addDays(10)->toDateString())
            ->where('subscription.periodStart', today()->addDays(10)->subMonth()->toDateString())
            ->where('subscription.suspended', false));
});

test('a store that has not paid yet is shown in its trial period', function () {
    $this->subscription->update(['current_period_end' => null]);

    $this->actingAs($this->user)
        ->get(shopRoute('billing.show'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('subscription.trial', true)
            ->where('subscription.periodStart', $this->subscription->created_at->toDateString()));
});

test('reports plan usage against the plan limits', function () {
    $this->subscription->plan->update(['limits' => ['max_customers' => 5]]);
    Customer::factory()->count(2)->create(['organization_id' => $this->organization->id]);

    $this->actingAs($this->user)
        ->get(shopRoute('billing.show'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('subscription.usage.0.key', 'customers')
            ->where('subscription.usage.0.used', 2)
            ->where('subscription.usage.0.limit', 5)
            ->where('subscription.usage.1.limit', null));
});

test('a store without a subscription gets an empty billing screen', function () {
    $this->subscription->delete();

    $this->actingAs($this->user)
        ->get(shopRoute('billing.show'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('subscription', null)->where('current', null));
});
