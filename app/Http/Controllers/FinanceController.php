<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Support\Ledger;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $period = in_array($request->query('period'), ['today', 'week', 'month'], true) ? $request->query('period') : 'month';

        [$from, $to] = match ($period) {
            'today' => [now()->startOfDay(), now()->endOfDay()],
            'week' => [now()->startOfWeek(), now()->endOfWeek()],
            default => [now()->startOfMonth(), now()->endOfMonth()],
        };

        $chartFrom = $period === 'month' ? $from : today()->subDays(6);
        $byDay = Payment::query()->whereBetween('paid_at', [$chartFrom, now()->endOfDay()])->get()->groupBy(fn (Payment $payment) => $payment->paid_at->toDateString());

        $series = [];

        for ($day = $chartFrom->startOfDay(); $day->lte(today()); $day = $day->addDay()) {
            $series[] = ['date' => $day->toDateString(), 'cents' => (int) ($byDay[$day->toDateString()] ?? collect())->sum('amount_cents')];
        }

        $revenue = Ledger::revenue($from, $to);
        $expenses = Ledger::expenses($from, $to);
        $receivable = Ledger::receivable($to);
        $payable = Ledger::payable($to);

        return Inertia::render('finance', [
            'period' => $period,
            'revenueCents' => $revenue,
            'expensesCents' => $expenses,
            'profitCents' => $revenue - $expenses,
            'receivableCents' => $receivable,
            'payableCents' => $payable,
            'series' => $series,
            'isEmpty' => $revenue + $expenses + $receivable + $payable === 0,
        ]);
    }
}
