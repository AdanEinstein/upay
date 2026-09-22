<?php

namespace App\Console\Commands;

use App\Enums\InvoiceStatus;
use App\Enums\OrganizationStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Organization;
use App\Models\Subscription;
use App\Models\SubscriptionInvoice;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('billing:run')]
#[Description('Create upcoming subscription invoices, mark overdue ones and suspend stores past the grace period')]
class BillingRun extends Command
{
    public function handle(): int
    {
        $created = $this->createInvoices();
        $overdue = $this->markPastDue();
        $suspended = $this->suspendOverdue();

        $this->info("Invoices created: {$created}; past due: {$overdue}; suspended: {$suspended}.");

        return self::SUCCESS;
    }

    private function createInvoices(): int
    {
        $created = 0;
        $horizon = today()->addDays(config('billing.lead_days'));

        Subscription::query()
            ->where('status', '!=', SubscriptionStatus::Canceled)
            ->whereNull('canceled_at')
            ->where('price_cents', '>', 0)
            ->with('plan')
            ->each(function (Subscription $subscription) use ($horizon, &$created): void {
                $dueDate = ($subscription->current_period_end ?? $subscription->created_at->addDays(config('billing.trial_days')))->startOfDay();

                if ($dueDate->gt($horizon)) {
                    return;
                }

                $invoice = SubscriptionInvoice::query()->firstOrCreate(
                    ['subscription_id' => $subscription->id, 'due_date' => $dueDate],
                    [
                        'organization_id' => $subscription->organization_id,
                        'cycle' => $subscription->billing_cycle,
                        'amount_cents' => $subscription->cycleAmountCents(),
                    ],
                );

                $created += (int) $invoice->wasRecentlyCreated;
            });

        return $created;
    }

    private function markPastDue(): int
    {
        return Subscription::query()
            ->where('status', SubscriptionStatus::Active)
            ->whereHas('invoices', fn ($q) => $q->whereIn('status', [InvoiceStatus::Open, InvoiceStatus::Claimed])->whereDate('due_date', '<', today()))
            ->update(['status' => SubscriptionStatus::PastDue]);
    }

    /**
     * A claimed invoice (waiting for the super admin) never suspends the store.
     */
    private function suspendOverdue(): int
    {
        $cutoff = today()->subDays(config('billing.grace_days'));

        return Organization::query()
            ->where('status', OrganizationStatus::Active)
            ->whereHas('invoices', fn ($q) => $q->where('status', InvoiceStatus::Open)->whereDate('due_date', '<', $cutoff))
            ->update(['status' => OrganizationStatus::Suspended, 'suspension_reason' => Organization::BILLING_SUSPENSION_REASON]);
    }
}
