<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementReason;
use App\Http\Requests\ProductRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        // ponytail: first 300 products, filtered client-side; add server search past that.
        return Inertia::render('products/index', [
            'products' => Product::query()
                ->with('images')
                ->orderBy('name')
                ->limit(300)
                ->get()
                ->map(fn (Product $product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'category' => $product->category,
                    'priceCents' => $product->price_cents,
                    'stock' => $product->stock_qty,
                    'minStock' => $product->min_stock,
                    'imageUrl' => $this->imageUrl($product),
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('products/form', ['product' => null, 'categories' => $this->categories()]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        $product = DB::transaction(function () use ($request): Product {
            $product = Product::create([
                ...$request->safe()->except(['variants', 'photos', 'remove_image_ids', 'stock_qty']),
                'stock_qty' => 0,
            ]);

            $this->syncVariantsAndStock($product, $request);
            $this->syncImages($product, $request);

            return $product;
        });

        return to_route('products.show', $product);
    }

    public function show(Product $product): Response
    {
        $product->load(['images', 'variants']);

        return Inertia::render('products/show', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'priceCents' => $product->price_cents,
                'costCents' => $product->cost_cents,
                'stock' => $product->stock_qty,
                'minStock' => $product->min_stock,
                'images' => $product->images->sortBy('position')->values()->map(fn ($image) => Storage::url($image->path)),
                'variants' => $product->variants->map(fn (ProductVariant $variant) => ['id' => $variant->id, 'name' => $variant->name, 'stock' => $variant->stock_qty]),
            ],
            'movements' => $product->stockMovements()->with('variant:id,name')->latest('id')->limit(10)->get()->map(fn (StockMovement $movement) => [
                'id' => $movement->id,
                'delta' => $movement->quantity_delta,
                'reason' => $movement->reason->value,
                'saleId' => $movement->sale_id,
                'variant' => $movement->variant?->name,
                'at' => $movement->created_at->toDateString(),
            ]),
        ]);
    }

    public function edit(Product $product): Response
    {
        $product->load(['images', 'variants']);

        return Inertia::render('products/form', [
            'categories' => $this->categories(),
            'product' => [
                ...$product->only(['id', 'name', 'description', 'category', 'price_cents', 'cost_cents', 'stock_qty', 'min_stock', 'catalog_visible']),
                'images' => $product->images->sortBy('position')->values()->map(fn ($image) => ['id' => $image->id, 'url' => Storage::url($image->path)]),
                'variants' => $product->variants->map(fn (ProductVariant $variant) => $variant->only(['id', 'name', 'stock_qty'])),
            ],
        ]);
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        DB::transaction(function () use ($request, $product): void {
            $product->update($request->safe()->except(['variants', 'photos', 'remove_image_ids', 'stock_qty']));

            $this->syncVariantsAndStock($product, $request);
            $this->syncImages($product, $request);
        });

        return to_route('products.show', $product);
    }

    private function syncVariantsAndStock(Product $product, ProductRequest $request): void
    {
        /** @var list<array{id?: int|string|null, name: string, stock_qty: int|string}> $rows */
        $rows = $request->validated('variants', []);
        $variants = collect($rows);

        if ($variants->isEmpty()) {
            $product->variants()->delete();
            $this->setStock($product, null, (int) $request->validated('stock_qty', 0));

            return;
        }

        $product->variants()->whereNotIn('id', $variants->pluck('id')->filter())->delete();

        foreach ($variants as $row) {
            $variant = isset($row['id'])
                ? $product->variants()->findOrFail((int) $row['id'])
                : $product->variants()->create(['name' => $row['name'], 'stock_qty' => 0]);

            $variant->update(['name' => $row['name']]);
            $this->setStock($product, $variant, (int) $row['stock_qty']);
        }

        $product->update(['stock_qty' => $product->variants()->sum('stock_qty')]);
    }

    private function setStock(Product $product, ?ProductVariant $variant, int $quantity): void
    {
        $target = $variant ?? $product;
        $delta = $quantity - $target->stock_qty;

        if ($delta === 0) {
            return;
        }

        $target->update(['stock_qty' => $quantity]);

        $product->stockMovements()->create([
            'product_variant_id' => $variant?->id,
            'quantity_delta' => $delta,
            'reason' => StockMovementReason::Adjustment,
        ]);
    }

    private function syncImages(Product $product, ProductRequest $request): void
    {
        foreach ($product->images()->whereIn('id', $request->validated('remove_image_ids', []))->get() as $image) {
            Storage::disk('public')->delete($image->path);
            $image->delete();
        }

        $position = (int) $product->images()->max('position') + 1;

        foreach ($request->file('photos', []) as $photo) {
            $product->images()->create([
                'path' => $photo->store('products/'.$product->organization_id, 'public'),
                'position' => $position++,
            ]);
        }
    }

    private function imageUrl(Product $product): ?string
    {
        $path = $product->images->sortBy('position')->first()?->path;

        return $path ? Storage::url($path) : null;
    }

    /**
     * @return array<int, string>
     */
    private function categories(): array
    {
        /** @var array<int, string> $categories */
        $categories = Product::query()->whereNotNull('category')->distinct()->orderBy('category')->pluck('category')->all();

        return $categories;
    }
}
