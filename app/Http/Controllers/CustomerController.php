<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Models\Customer;
use App\Models\Sale;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(): Response
    {
        // ponytail: first 300 customers, searched/filtered client-side; add server search past that.
        return Inertia::render('customers/index', [
            'customers' => Customer::query()
                ->withBalance()
                ->orderBy('name')
                ->limit(300)
                ->get()
                ->map(fn (Customer $customer) => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'balanceCents' => (int) $customer->balance_cents,
                ]),
        ]);
    }

    public function create(): Response|RedirectResponse
    {
        if (Tenant::current()->hasReachedCustomerLimit()) {
            return to_route('plan-limit.show');
        }

        return Inertia::render('customers/form', ['customer' => null]);
    }

    public function store(CustomerRequest $request): RedirectResponse
    {
        if (Tenant::current()->hasReachedCustomerLimit()) {
            return to_route('plan-limit.show');
        }

        $customer = Customer::create($request->validated());

        return $request->input('from') === 'sale'
            ? to_route('sales.create', ['customer' => $customer->id])
            : to_route('customers.show', $customer);
    }

    public function show(Customer $customer): Response
    {
        $balance = Customer::query()->withBalance()->findOrFail($customer->id)->balance_cents;

        return Inertia::render('customers/show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'notes' => $customer->notes,
                'publicToken' => $customer->public_token,
                'since' => $customer->created_at->toDateString(),
                'balanceCents' => (int) $balance,
            ],
            'sales' => $customer->sales()
                ->with(['items.product:id,name', 'installments.payments'])
                ->latest('sold_at')
                ->limit(20)
                ->get()
                ->map(fn (Sale $sale) => [
                    'id' => $sale->id,
                    'soldAt' => $sale->sold_at->toDateString(),
                    'totalCents' => $sale->total_cents,
                    'items' => $sale->items->pluck('product.name')->unique()->values(),
                    'installmentCount' => $sale->installments->where('number', '>', 0)->count(),
                    'status' => $sale->settlement()['status'],
                ]),
        ]);
    }

    public function edit(Customer $customer): Response
    {
        return Inertia::render('customers/form', [
            'customer' => $customer->only(['id', 'name', 'phone', 'document', 'address', 'notes']),
        ]);
    }

    public function update(CustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        return to_route('customers.show', $customer);
    }
}
