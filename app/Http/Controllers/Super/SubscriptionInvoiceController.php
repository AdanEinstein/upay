<?php

namespace App\Http\Controllers\Super;

use App\Enums\InvoiceStatus;
use App\Enums\OrganizationStatus;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Super\RejectInvoiceRequest;
use App\Models\Organization;
use App\Models\SubscriptionInvoice;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubscriptionInvoiceController extends Controller
{
    private const array FILTERS = ['claimed', 'open', 'overdue', 'paid', 'all'];

    public function index(Request $request): Response
    {
        $filter = in_array($request->query('filter'), self::FILTERS, true) ? $request->query('filter') : 'claimed';
        $search = trim((string) $request->query('q'));

        $payable = [InvoiceStatus::Open, InvoiceStatus::Claimed];

        $invoices = SubscriptionInvoice::query()
            ->with(['organization', 'subscription.plan'])
            ->when($filter === 'claimed', fn (Builder $q) => $q->where('status', InvoiceStatus::Claimed))
            ->when($filter === 'open', fn (Builder $q) => $q->where('status', InvoiceStatus::Open))
            ->when($filter === 'overdue', fn (Builder $q) => $q->whereIn('status', $payable)->whereDate('due_date', '<', today()))
            ->when($filter === 'paid', fn (Builder $q) => $q->where('status', InvoiceStatus::Paid))
            ->when($search !== '', fn (Builder $q) => $q->whereHas('organization', fn (Builder $o) => $o->where('name', 'like', '%'.$search.'%')))
            ->orderByRaw('status = ? desc', [InvoiceStatus::Claimed->value])
            ->orderBy('due_date')
            ->orderBy('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (SubscriptionInvoice $invoice) => [
                'id' => $invoice->id,
                'organization' => $invoice->organization->name,
                'plan' => $invoice->subscription->plan->name,
                'cycle' => $invoice->cycle->value,
                'amountCents' => $invoice->amount_cents,
                'dueDate' => $invoice->due_date->toDateString(),
                'status' => $invoice->status->value,
                'overdue' => $invoice->isPayable() && $invoice->due_date->lt(today()),
                'claimedAt' => $invoice->claimed_at?->toIso8601String(),
                'paidAt' => $invoice->paid_at?->toIso8601String(),
                'rejectionReason' => $invoice->rejection_reason,
                'receiptType' => $this->receiptType($invoice),
                'receiptUrl' => $invoice->receipt_path ? route('super-admin.billing.receipt', $invoice) : null,
            ]);

        return Inertia::render('super/billing', [
            'invoices' => $invoices,
            'filters' => ['filter' => $filter, 'q' => $search],
            'kpis' => [
                'claimed' => SubscriptionInvoice::query()->where('status', InvoiceStatus::Claimed)->count(),
                'open' => SubscriptionInvoice::query()->where('status', InvoiceStatus::Open)->count(),
                'overdue' => SubscriptionInvoice::query()->whereIn('status', $payable)->whereDate('due_date', '<', today())->count(),
                'receivedMonthCents' => (int) SubscriptionInvoice::query()->where('status', InvoiceStatus::Paid)->where('paid_at', '>=', now()->startOfMonth())->sum('amount_cents'),
            ],
        ]);
    }

    /**
     * Also used for a manual payment (invoice still Open): renews the period and lifts a billing suspension.
     */
    public function approve(SubscriptionInvoice $invoice): RedirectResponse
    {
        DB::transaction(function () use ($invoice): void {
            $invoice = SubscriptionInvoice::query()->whereKey($invoice->id)->lockForUpdate()->firstOrFail();

            if (! $invoice->isPayable()) {
                return;
            }

            $invoice->update(['status' => InvoiceStatus::Paid, 'paid_at' => now(), 'rejection_reason' => null]);

            $subscription = $invoice->subscription;
            $base = max($subscription->current_period_end ?? $invoice->due_date, today());

            $subscription->update([
                'status' => SubscriptionStatus::Active,
                'current_period_end' => $base->copy()->addMonthsNoOverflow($invoice->cycle->months())->startOfDay(),
            ]);

            $organization = $invoice->organization;

            if ($organization->status === OrganizationStatus::Suspended && $organization->suspension_reason === Organization::BILLING_SUSPENSION_REASON) {
                $organization->update(['status' => OrganizationStatus::Active, 'suspension_reason' => null]);
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment confirmed.')]);

        return back();
    }

    public function reject(RejectInvoiceRequest $request, SubscriptionInvoice $invoice): RedirectResponse
    {
        if ($invoice->status === InvoiceStatus::Claimed) {
            $invoice->update([
                'status' => InvoiceStatus::Open,
                'claimed_at' => null,
                'rejection_reason' => $request->validated('reason'),
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment notice rejected.')]);

        return back();
    }

    public function receipt(SubscriptionInvoice $invoice): StreamedResponse
    {
        abort_unless($invoice->receipt_path && Storage::disk('local')->exists($invoice->receipt_path), 404);

        return Storage::disk('local')->response($invoice->receipt_path, null, ['X-Content-Type-Options' => 'nosniff']);
    }

    private function receiptType(SubscriptionInvoice $invoice): ?string
    {
        if (! $invoice->receipt_path) {
            return null;
        }

        return strtolower(pathinfo($invoice->receipt_path, PATHINFO_EXTENSION)) === 'pdf' ? 'pdf' : 'image';
    }
}
