<?php

namespace App\Http\Controllers;

use App\Http\Requests\PromotionRequest;
use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PromotionController extends Controller
{
    public function index(): Response
    {
        $tab = fn ($query) => $query->with('products:id,name')->orderBy('id', 'desc')->get()->map(fn (Promotion $promotion) => [
            'id' => $promotion->id,
            'name' => $promotion->name,
            'type' => $promotion->type->value,
            'percent' => $promotion->percent,
            'startsOn' => $promotion->starts_on?->toDateString(),
            'endsOn' => $promotion->ends_on?->toDateString(),
            'productCount' => $promotion->products->count(),
        ]);

        return Inertia::render('promotions/index', [
            'tabs' => [
                'active' => $tab(Promotion::query()->active()),
                'scheduled' => $tab(Promotion::query()->scheduled()),
                'expired' => $tab(Promotion::query()->expired()),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('promotions/form', ['promotion' => null, 'products' => $this->products()]);
    }

    public function store(PromotionRequest $request): RedirectResponse
    {
        $this->save(new Promotion, $request);

        return to_route('promotions.index');
    }

    public function edit(Promotion $promotion): Response
    {
        return Inertia::render('promotions/form', [
            'products' => $this->products(),
            'promotion' => [
                'id' => $promotion->id,
                'type' => $promotion->type->value,
                'percent' => $promotion->percent,
                'originalPriceCents' => $promotion->original_price_cents,
                'promoPriceCents' => $promotion->promo_price_cents,
                'startsOn' => $promotion->starts_on?->toDateString(),
                'endsOn' => $promotion->ends_on?->toDateString(),
                'productIds' => $promotion->products()->pluck('products.id'),
            ],
        ]);
    }

    public function update(PromotionRequest $request, Promotion $promotion): RedirectResponse
    {
        $this->save($promotion, $request);

        return to_route('promotions.index');
    }

    public function destroy(Promotion $promotion): RedirectResponse
    {
        $promotion->delete();

        return to_route('promotions.index');
    }

    private function save(Promotion $promotion, PromotionRequest $request): void
    {
        $names = Product::query()->whereIn('id', $request->validated('product_ids'))->orderBy('name')->pluck('name');

        $promotion->fill([
            ...$request->safe()->except('product_ids'),
            'name' => $names->first().($names->count() > 1 ? ' +'.($names->count() - 1) : ''),
        ])->save();

        $promotion->products()->sync($request->validated('product_ids'));
    }

    /**
     * @return list<array{id: int, name: string, priceCents: int}>
     */
    private function products(): array
    {
        return Product::query()->orderBy('name')->get(['id', 'name', 'price_cents'])
            ->map(fn (Product $product) => ['id' => $product->id, 'name' => $product->name, 'priceCents' => $product->price_cents])
            ->all();
    }
}
