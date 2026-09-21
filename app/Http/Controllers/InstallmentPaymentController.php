<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentStoreRequest;
use App\Models\Installment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Date;
use Inertia\Inertia;

class InstallmentPaymentController extends Controller
{
    public function store(PaymentStoreRequest $request, Installment $installment): RedirectResponse
    {
        $paidOn = $request->validated('paid_on');

        $installment->payments()->create([
            'amount_cents' => $request->validated('amount_cents'),
            'method' => $request->validated('method'),
            'paid_at' => $paidOn ? Date::parse($paidOn)->setTimeFrom(now()) : now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment registered.')]);

        return back();
    }
}
