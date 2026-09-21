<?php

namespace App\Http\Controllers;

use App\Enums\ClaimStatus;
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

        $installment->claims()->create([
            'amount_cents' => $remaining,
            'status' => ClaimStatus::Pending,
            'receipt_path' => $request->file('receipt')?->store('receipts/'.$customer->organization_id, 'local'),
        ]);

        return back();
    }
}
