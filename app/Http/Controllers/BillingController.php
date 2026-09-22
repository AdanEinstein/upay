<?php

namespace App\Http\Controllers;

use App\Enums\InvoiceStatus;
use App\Enums\PixKeyType;
use App\Http\Requests\BillingClaimRequest;
use App\Models\Organization;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use App\Support\PixPayload;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function show(): Response
    {
        $organization = Tenant::current();
        $subscription = $organization->subscription;

        $invoices = $organization->invoices()->latest('due_date')->limit(24)->get();
        $current = $invoices->first(fn (SubscriptionInvoice $invoice) => $invoice->isPayable());

        $pixKey = config('billing.pix_key');
        $payload = $current && $pixKey
            ? PixPayload::make(PixKeyType::from(config('billing.pix_key_type')), $pixKey, config('billing.merchant_name'), $current->amount_cents)
            : null;

        return Inertia::render('billing/show', [
            'subscription' => $subscription ? $this->subscription($subscription, $organization) : null,
            'current' => $current ? [...$this->invoice($current), 'pixCode' => $payload, 'pixQr' => $payload ? PixPayload::qrSvg($payload) : null] : null,
            'history' => $invoices->reject(fn (SubscriptionInvoice $invoice) => $invoice->is($current))->map(fn (SubscriptionInvoice $invoice) => $this->invoice($invoice))->values(),
            'supportWhatsapp' => config('services.support.whatsapp'),
        ]);
    }

    public function claim(BillingClaimRequest $request, SubscriptionInvoice $invoice): RedirectResponse
    {
        $organization = Tenant::current();

        abort_unless($invoice->organization_id === $organization->id, 404);
        abort_unless($invoice->status === InvoiceStatus::Open, 422);

        $receipt = $request->file('receipt');

        if ($receipt && $invoice->receipt_path) {
            Storage::disk('local')->delete($invoice->receipt_path);
        }

        $invoice->update([
            'status' => InvoiceStatus::Claimed,
            'claimed_at' => now(),
            'rejection_reason' => null,
            'receipt_path' => $receipt ? $receipt->store('billing-receipts/'.$organization->id, 'local') : $invoice->receipt_path,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment notice sent. We will confirm it shortly.')]);

        return back();
    }

    /**
     * The period is derived: it ends at current_period_end (or after the trial, before the first payment)
     * and starts one billing cycle earlier.
     *
     * @return array<string, mixed>
     */
    private function subscription(Subscription $subscription, Organization $organization): array
    {
        $end = ($subscription->current_period_end ?? $subscription->created_at->addDays(config('billing.trial_days')))->startOfDay();
        $start = $subscription->current_period_end
            ? $end->copy()->subMonthsNoOverflow($subscription->billing_cycle->months())
            : $subscription->created_at->startOfDay();

        return [
            'plan' => $subscription->plan->name,
            'cycle' => $subscription->billing_cycle->value,
            'status' => $subscription->status->value,
            'suspended' => ! $organization->isActive(),
            'trial' => $subscription->current_period_end === null,
            'periodStart' => $start->toDateString(),
            'periodEnd' => $end->toDateString(),
            'periodDays' => max(1, (int) $start->diffInDays($end)),
            'daysLeft' => (int) today()->diffInDays($end, false),
            'canceledAt' => $subscription->canceled_at?->toDateString(),
            'usage' => $organization->planUsage(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function invoice(SubscriptionInvoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'cycle' => $invoice->cycle->value,
            'amountCents' => $invoice->amount_cents,
            'dueDate' => $invoice->due_date->toDateString(),
            'status' => $invoice->status->value,
            'overdue' => $invoice->isPayable() && $invoice->due_date->isPast() && ! $invoice->due_date->isToday(),
            'rejectionReason' => $invoice->rejection_reason,
        ];
    }
}
