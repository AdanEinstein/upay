<?php

namespace App\Http\Controllers;

use App\Models\Installment;
use Inertia\Inertia;
use Inertia\Response;

class ReceivableController extends Controller
{
    public function __invoke(): Response
    {
        $groups = ['overdue' => [], 'today' => [], 'week' => [], 'later' => []];

        Installment::query()
            ->unpaid()
            ->withRemaining()
            ->with('customer:id,name')
            ->orderBy('due_date')
            ->limit(300)
            ->get()
            ->each(function (Installment $installment) use (&$groups): void {
                $group = match (true) {
                    $installment->due_date->isToday() => 'today',
                    $installment->due_date->isPast() => 'overdue',
                    $installment->due_date->lte(today()->endOfWeek()) => 'week',
                    default => 'later',
                };

                $groups[$group][] = [
                    'id' => $installment->id,
                    'customer' => $installment->customer?->name,
                    'dueDate' => $installment->due_date->toDateString(),
                    'amountCents' => (int) $installment->remaining_cents,
                ];
            });

        return Inertia::render('receivables', ['groups' => $groups]);
    }
}
