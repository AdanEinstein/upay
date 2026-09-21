<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementReason;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductStockController extends Controller
{
    public function store(Request $request, Product $product): RedirectResponse
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:9999'],
            'variant_id' => ['nullable', 'integer'],
        ]);

        DB::transaction(function () use ($product, $data): void {
            $variant = $data['variant_id'] ? $product->variants()->findOrFail((int) $data['variant_id']) : null;

            $product->increment('stock_qty', $data['quantity']);
            $variant?->increment('stock_qty', $data['quantity']);

            $product->stockMovements()->create([
                'product_variant_id' => $variant?->id,
                'quantity_delta' => $data['quantity'],
                'reason' => StockMovementReason::Adjustment,
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Stock updated.')]);

        return back();
    }
}
