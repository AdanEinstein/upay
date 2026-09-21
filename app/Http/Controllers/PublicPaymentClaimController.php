<?php

namespace App\Http\Controllers;

use App\Enums\ClaimStatus;
use App\Events\PaymentClaimCreated;
use App\Http\Requests\PaymentClaimStoreRequest;
use App\Models\Customer;
use App\Models\Installment;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;

class PublicPaymentClaimController extends Controller
{
    public function store(PaymentClaimStoreRequest $request, string $token, int $installment): RedirectResponse
    {
        $customer = Customer::query()->withoutTenant()->where('public_token', $token)->with('organization')->first();

        abort_if($customer === null || ! $customer->organization->isActive(), 404);

        Tenant::use($customer->organization);
        app()->terminating(Tenant::forget(...));

        $installment = Installment::query()->where('customer_id', $customer->id)->findOrFail($installment);
        $remaining = $installment->remainingCents();

        if ($remaining === 0 || $installment->claims()->where('status', ClaimStatus::Pending)->exists()) {
            return back();
        }

        $claim = $installment->claims()->create([
            'amount_cents' => $remaining,
            'status' => ClaimStatus::Pending,
            'receipt_path' => $request->file('receipt')?->store('receipts/'.$customer->organization_id, 'local'),
        ]);

        PaymentClaimCreated::dispatch($claim->organization_id, $claim->id, $installment->sale_id, $customer->name, $claim->amount_cents, $claim->receipt_path !== null);

        return back();
    }
}
