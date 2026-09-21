<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Inertia\Inertia;
use Inertia\Response;

class PayableController extends Controller
{
    public function __invoke(): Response
    {
        $groups = ['overdue' => [], 'today' => [], 'week' => [], 'later' => []];

        Expense::query()->whereNull('paid_at')->orderBy('due_date')->limit(300)->get()->each(function (Expense $expense) use (&$groups): void {
            $group = match (true) {
                $expense->due_date->isToday() => 'today',
                $expense->due_date->isPast() => 'overdue',
                $expense->due_date->lte(today()->endOfWeek()) => 'week',
                default => 'later',
            };

            $groups[$group][] = [
                'id' => $expense->id,
                'description' => $expense->description,
                'dueDate' => $expense->due_date->toDateString(),
                'amountCents' => $expense->amount_cents,
            ];
        });

        return Inertia::render('payables', ['groups' => $groups]);
    }
}
