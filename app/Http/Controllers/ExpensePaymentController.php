<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpensePaymentController extends Controller
{
    public function __invoke(Request $request, Expense $expense): RedirectResponse
    {
        // Set by the offline queue; a few minutes of slack for a phone clock running ahead.
        $occurredAt = $request->validate(['occurred_at' => ['nullable', 'date', 'before_or_equal:+10 minutes']])['occurred_at'] ?? null;

        $expense->markPaid($occurredAt ? CarbonImmutable::parse($occurredAt)->setTimezone(config('app.timezone'))->min(CarbonImmutable::now()) : null);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Expense marked as paid.')]);

        return back();
    }
}
