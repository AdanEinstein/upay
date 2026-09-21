<?php

namespace App\Http\Controllers;

use App\Enums\ClaimStatus;
use App\Enums\SaleStatus;
use App\Enums\StockMovementReason;
use App\Http\Requests\SaleStoreRequest;
use App\Models\Customer;
use App\Models\Installment;
use App\Models\Product;
use App\Models\Sale;
use App\Support\RegisterSale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(): Response
    {
        // ponytail: latest 200 sales, filtered client-side; add server pagination past that.
        return Inertia::render('sales/index', [
            'sales' => Sale::query()
                ->with(['customer:id,name', 'installments.payments'])
                ->latest('sold_at')
                ->limit(200)
                ->get()
                ->map(fn (Sale $sale) => [
                    'id' => $sale->id,
                    'customer' => $sale->customer?->name,
                    'totalCents' => $sale->total_cents,
                    ...$sale->settlement(),
                ]),
        ]);
    }

    public function create(Request $request): Response
    {
        $products = Product::query()->with(['variants', 'images'])->where('active', true)->orderBy('name')->get();

        return Inertia::render('sales/create', [
            'customers' => Customer::query()->orderBy('name')->limit(200)->get(['id', 'name', 'phone']),
            'selectedCustomerId' => $request->integer('customer') ?: null,
            'sellables' => $products->flatMap(fn (Product $product) => $product->variants->isEmpty()
                ? [$this->sellable($product, null)]
                : $product->variants->map(fn ($variant) => $this->sellable($product, $variant)),
            )->values(),
            'categories' => $products->pluck('category')->filter()->unique()->values(),
        ]);
    }

    public function store(SaleStoreRequest $request, RegisterSale $registerSale): RedirectResponse
    {
        $sale = $registerSale->handle($request->validated());

        return to_route('sales.show', ['sale' => $sale, 'created' => 1]);
    }

    public function show(Request $request, Sale $sale): Response
    {
        $sale->load(['customer', 'items.product', 'items.variant', 'installments' => fn ($query) => $query->withRemaining()->orderBy('number')->with(['payments', 'claims' => fn ($claims) => $claims->where('status', ClaimStatus::Pending)])]);

        return Inertia::render('sales/show', [
            'justCreated' => $request->boolean('created'),
            'sale' => [
                'id' => $sale->id,
                'totalCents' => $sale->total_cents,
                'cancelled' => $sale->status === SaleStatus::Cancelled,
                'customer' => $sale->customer ? [
                    'id' => $sale->customer->id,
                    'name' => $sale->customer->name,
                    'phone' => $sale->customer->phone,
                    'publicToken' => $sale->customer->public_token,
                ] : null,
                'items' => $sale->items->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->product->name.($item->variant ? ' · '.$item->variant->name : ''),
                    'quantity' => $item->quantity,
                    'unitPriceCents' => $item->unit_price_cents,
                ]),
                'installments' => $sale->installments->map(fn (Installment $installment) => [
                    'id' => $installment->id,
                    'number' => $installment->number,
                    'amountCents' => $installment->amount_cents,
                    'remainingCents' => (int) $installment->remaining_cents,
                    'dueDate' => $installment->due_date->toDateString(),
                    'paidAt' => $installment->remaining_cents == 0 ? $installment->payments->max('paid_at')?->toDateString() : null,
                    'claim' => ($claim = $installment->claims->first()) ? ['id' => $claim->id, 'receiptType' => match (true) {
                        $claim->receipt_path === null => null,
                        str_ends_with($claim->receipt_path, '.pdf') => 'pdf',
                        default => 'image',
                    }] : null,
                ]),
                'installmentCount' => $sale->installments->where('number', '>', 0)->count(),
            ],
        ]);
    }

    public function destroy(Sale $sale): RedirectResponse
    {
        if ($sale->status === SaleStatus::Cancelled) {
            return back();
        }

        DB::transaction(function () use ($sale): void {
            foreach ($sale->items()->with('variant')->get() as $item) {
                $item->product->increment('stock_qty', $item->quantity);
                $item->variant?->increment('stock_qty', $item->quantity);

                $item->product->stockMovements()->create([
                    'product_variant_id' => $item->product_variant_id,
                    'sale_id' => $sale->id,
                    'quantity_delta' => $item->quantity,
                    'reason' => StockMovementReason::Return,
                ]);
            }

            // Cash-basis: cancelling a sale refunds it, so its payments stop counting as revenue.
            $sale->installments()->each(function (Installment $installment): void {
                $installment->payments()->delete();
                $installment->delete();
            });

            $sale->update(['status' => SaleStatus::Cancelled]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Sale cancelled.')]);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function sellable(Product $product, $variant): array
    {
        return [
            'key' => $product->id.'-'.($variant?->id ?? 0),
            'productId' => $product->id,
            'variantId' => $variant?->id,
            'name' => $product->name.($variant ? ' · '.$variant->name : ''),
            'category' => $product->category,
            'priceCents' => $variant?->price_cents ?? $product->price_cents,
            'stock' => $variant?->stock_qty ?? $product->stock_qty,
            'imageUrl' => ($path = $product->images->sortBy('position')->first()?->path) ? Storage::url($path) : null,
        ];
    }
}
