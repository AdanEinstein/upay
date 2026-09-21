<?php

namespace App\Http\Controllers;

use App\Enums\ClaimStatus;
use App\Enums\PaymentMethod;
use App\Models\PaymentClaim;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentClaimController extends Controller
{
    public function confirm(PaymentClaim $claim): RedirectResponse
    {
        DB::transaction(function () use ($claim): void {
            $claim = PaymentClaim::query()->whereKey($claim->id)->lockForUpdate()->firstOrFail();

            if ($claim->status !== ClaimStatus::Pending) {
                return;
            }

            $amount = min($claim->amount_cents, $claim->installment->remainingCents());

            if ($amount > 0) {
                $claim->installment->payments()->create([
                    'amount_cents' => $amount,
                    'method' => PaymentMethod::Pix,
                    'paid_at' => now(),
                ]);
            }

            $claim->update(['status' => ClaimStatus::Confirmed, 'resolved_at' => now()]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment registered.')]);

        return back();
    }

    public function reject(PaymentClaim $claim): RedirectResponse
    {
        if ($claim->status === ClaimStatus::Pending) {
            $claim->update(['status' => ClaimStatus::Rejected, 'resolved_at' => now()]);
        }

        return back();
    }

    public function receipt(PaymentClaim $claim): StreamedResponse
    {
        abort_unless($claim->receipt_path && Storage::disk('local')->exists($claim->receipt_path), 404);

        return Storage::disk('local')->response($claim->receipt_path, null, ['X-Content-Type-Options' => 'nosniff']);
    }
}
