<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class ExpensePaymentController extends Controller
{
    public function __invoke(Expense $expense): RedirectResponse
    {
        $expense->markPaid();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Expense marked as paid.')]);

        return back();
    }
}
