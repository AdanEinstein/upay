<?php

namespace App\Http\Controllers;

use App\Enums\ClaimStatus;
use App\Models\Installment;
use App\Models\PaymentClaim;
use App\Models\Product;
use App\Models\Sale;
use App\Support\Ledger;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        $pendingClaims = PaymentClaim::query()->where('status', ClaimStatus::Pending);

        return Inertia::render('home', [
            'pendingClaimsCount' => (clone $pendingClaims)->count(),
            'pendingClaims' => (clone $pendingClaims)
                ->with('installment.customer:id,name')
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (PaymentClaim $claim) => [
                    'id' => $claim->id,
                    'saleId' => $claim->installment->sale_id,
                    'customer' => $claim->installment->customer?->name,
                    'amountCents' => $claim->amount_cents,
                    'hasReceipt' => $claim->receipt_path !== null,
                    'createdAt' => $claim->created_at->toIso8601String(),
                ]),
            'hasSales' => Sale::query()->exists(),
            'salesTodayCents' => (int) Sale::query()->whereDate('sold_at', today())->sum('total_cents'),
            'monthProfitCents' => Ledger::profit(now()->startOfMonth(), now()->endOfMonth()),
            'receivableTodayCents' => Ledger::receivable(today(), today()),
            'receivableOverdueCents' => Ledger::receivable(today()->subDay()),
            'lowStock' => Product::query()
                ->where('active', true)
                ->whereColumn('stock_qty', '<=', 'min_stock')
                ->orderBy('stock_qty')
                ->limit(5)
                ->get(['id', 'name', 'stock_qty'])
                ->map(fn (Product $product) => ['id' => $product->id, 'name' => $product->name, 'quantity' => $product->stock_qty]),
            'owed' => Installment::query()
                ->unpaid()
                ->withRemaining()
                ->with('customer:id,name,phone,public_token')
                ->whereDate('due_date', '<=', today())
                ->orderBy('due_date')
                ->whereNotNull('customer_id')
                ->limit(5)
                ->get()
                ->map(fn (Installment $installment) => [
                    'id' => $installment->id,
                    'customer' => $installment->customer->name,
                    'phone' => $installment->customer->phone,
                    'publicToken' => $installment->customer->public_token,
                    'amountCents' => (int) $installment->remaining_cents,
                    'dueDate' => $installment->due_date->toDateString(),
                    'isOverdue' => $installment->due_date->isBefore(today()),
                ]),
        ]);
    }
}
