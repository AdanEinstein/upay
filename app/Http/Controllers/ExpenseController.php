<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExpenseRequest;
use App\Models\Expense;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExpenseController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('expenses/index', [
            'expenses' => Expense::query()
                ->orderByDesc('due_date')
                ->limit(300)
                ->get()
                ->map(fn (Expense $expense) => [
                    'id' => $expense->id,
                    'category' => $expense->category,
                    'description' => $expense->description,
                    'amountCents' => $expense->amount_cents,
                    'dueDate' => $expense->due_date->toDateString(),
                    'paid' => $expense->paid_at !== null,
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('expenses/form', ['expense' => null]);
    }

    public function store(ExpenseRequest $request): RedirectResponse
    {
        $expense = Expense::create($this->attributes($request));

        if ($request->boolean('paid')) {
            $expense->markPaid();
        }

        return to_route('expenses.index');
    }

    public function edit(Expense $expense): Response
    {
        return Inertia::render('expenses/form', [
            'expense' => [
                'id' => $expense->id,
                'amountCents' => $expense->amount_cents,
                'category' => $expense->category,
                'dueDate' => $expense->due_date->toDateString(),
                'description' => $expense->description,
                'recurring' => $expense->recurring,
                'paid' => $expense->paid_at !== null,
                'receiptUrl' => $expense->receipt_path ? route('expenses.receipt', $expense) : null,
            ],
        ]);
    }

    public function update(ExpenseRequest $request, Expense $expense): RedirectResponse
    {
        $expense->update($this->attributes($request));

        if ($request->boolean('paid')) {
            $expense->markPaid();
        } else {
            $expense->update(['paid_at' => null]);
        }

        return to_route('expenses.index');
    }

    public function receipt(Expense $expense): StreamedResponse
    {
        abort_unless($expense->receipt_path && Storage::disk('local')->exists($expense->receipt_path), 404);

        return Storage::disk('local')->response($expense->receipt_path, null, ['X-Content-Type-Options' => 'nosniff']);
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(ExpenseRequest $request): array
    {
        $attributes = $request->safe()->only(['amount_cents', 'category', 'due_date', 'description']) + ['recurring' => $request->boolean('recurring')];

        if ($request->hasFile('receipt')) {
            $attributes['receipt_path'] = $request->file('receipt')->store('expenses/'.$request->user()->organization_id, 'local');
        }

        return $attributes;
    }
}
