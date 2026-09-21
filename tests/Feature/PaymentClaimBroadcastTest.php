<?php

use App\Enums\ClaimStatus;
use App\Events\PaymentClaimCreated;
use App\Models\Customer;
use App\Models\Installment;
use App\Models\Payment;
use App\Models\PaymentClaim;
use App\Models\Sale;
use App\Models\User;
use App\Support\Tenant;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->organization = $this->user->organization;
    $this->customer = Customer::factory()->create(['organization_id' => $this->organization->id, 'name' => 'Maria']);
    $this->sale = Sale::factory()->create(['organization_id' => $this->organization->id, 'customer_id' => $this->customer->id, 'total_cents' => 15000]);
    $this->installment = Installment::factory()->create(['sale_id' => $this->sale->id, 'amount_cents' => 15000]);
});

afterEach(fn () => Tenant::forget());

function notify(): void
{
    test()->post(route('public.debt.claim', [test()->customer->public_token, test()->installment->id]));
}

test('a new notice broadcasts to the store', function () {
    Event::fake([PaymentClaimCreated::class]);

    notify();

    Event::assertDispatched(PaymentClaimCreated::class, fn (PaymentClaimCreated $event) => $event->organizationId === $this->organization->id
        && $event->saleId === $this->sale->id
        && $event->customerName === 'Maria'
        && $event->amountCents === 15000
        && $event->hasReceipt === false);
});

test('duplicate notices and paid installments do not broadcast', function () {
    Event::fake([PaymentClaimCreated::class]);

    notify();
    notify();
    Event::assertDispatchedTimes(PaymentClaimCreated::class, 1);

    PaymentClaim::query()->withoutTenant()->delete();
    Payment::factory()->create(['installment_id' => $this->installment->id, 'amount_cents' => 15000]);
    notify();
    Event::assertDispatchedTimes(PaymentClaimCreated::class, 1);
});

test('the event goes to the store private channel with a stable name and payload', function () {
    $event = new PaymentClaimCreated(7, 3, 9, 'Maria', 15000, true);

    expect($event->broadcastOn())->toHaveCount(1)
        ->and($event->broadcastOn()[0])->toBeInstanceOf(PrivateChannel::class)
        ->and($event->broadcastOn()[0]->name)->toBe('private-organization.7')
        ->and($event->broadcastAs())->toBe('payment-claim.created')
        ->and($event->broadcastWith())->toBe(['claimId' => 3, 'saleId' => 9, 'customer' => 'Maria', 'amountCents' => 15000, 'hasReceipt' => true]);
});

test('only users of the store may subscribe to its channel', function () {
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.key' => 'test-key',
        'broadcasting.connections.reverb.secret' => 'test-secret',
        'broadcasting.connections.reverb.app_id' => '1',
    ]);
    // Channels were registered on the `null` driver at boot; register them on reverb too.
    Broadcast::purge();
    require base_path('routes/channels.php');
    $stranger = User::factory()->create();
    $payload = ['channel_name' => 'private-organization.'.$this->organization->id, 'socket_id' => '1234.5678'];

    $this->actingAs($this->user)->post('/broadcasting/auth', $payload)->assertOk();
    $this->actingAs($stranger)->post('/broadcasting/auth', $payload)->assertForbidden();
    auth()->logout();
    $this->post('/broadcasting/auth', $payload)->assertForbidden();
});

test('home lists only this store\'s pending notices with the count', function () {
    PaymentClaim::factory()->create(['installment_id' => $this->installment->id, 'amount_cents' => 15000]);
    $resolved = Installment::factory()->create(['sale_id' => $this->sale->id, 'number' => 2, 'amount_cents' => 5000]);
    PaymentClaim::factory()->create(['installment_id' => $resolved->id, 'status' => ClaimStatus::Confirmed]);
    PaymentClaim::factory()->create();

    $this->actingAs($this->user)->get(shopRoute('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('pendingClaimsCount', 1)
            ->has('pendingClaims', 1)
            ->where('pendingClaims.0.customer', 'Maria')
            ->where('pendingClaims.0.saleId', $this->sale->id)
            ->where('pendingClaims.0.amountCents', 15000));
});
