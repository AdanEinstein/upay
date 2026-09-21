<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\ShopSetting;
use App\Support\Tenant;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicCatalogController extends Controller
{
    public function show(string $slug): Response|HttpResponse
    {
        $organization = Organization::query()->where('slug', $slug)->first();

        if ($organization === null || ! $organization->isActive()) {
            return $this->unavailable();
        }

        Tenant::use($organization);
        app()->terminating(Tenant::forget(...));

        $settings = ShopSetting::current();

        if (! $settings->catalog_public) {
            return $this->unavailable();
        }

        return Inertia::render('public/catalog', [
            'store' => [
                'name' => $organization->name,
                'logoUrl' => $organization->logo_path ? Storage::url($organization->logo_path) : null,
                'coverUrl' => $settings->cover_path ? Storage::url($settings->cover_path) : null,
                'welcomeText' => $settings->welcome_text,
                'whatsapp' => $settings->whatsapp,
            ],
            'notice' => $settings->hasLiveNotice() ? ['text' => $settings->notice_text, 'type' => $settings->notice_type->value] : null,
            'products' => Inertia::defer(fn () => $this->products()),
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function products(): array
    {
        $promotions = Promotion::query()->active()->with('products:id')->get();

        return Product::query()
            ->with(['images', 'variants'])
            ->where('active', true)
            ->where('catalog_visible', true)
            ->orderBy('name')
            ->limit(200)
            ->get()
            ->map(function (Product $product) use ($promotions) {
                $promoPrice = $promotions
                    ->filter(fn (Promotion $promotion) => $promotion->products->contains('id', $product->id))
                    ->map(fn (Promotion $promotion) => $promotion->promo_price_cents ?? (int) round($product->price_cents * (100 - (int) $promotion->percent) / 100))
                    ->min();

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'category' => $product->category,
                    'priceCents' => $product->price_cents,
                    'promoPriceCents' => $promoPrice !== null && $promoPrice < $product->price_cents ? $promoPrice : null,
                    'images' => $product->images->sortBy('position')->map(fn ($image) => Storage::url($image->path))->values(),
                    'variants' => $product->variants->map(fn ($variant) => [
                        'id' => $variant->id,
                        'name' => $variant->name,
                        'priceCents' => $variant->price_cents,
                        'inStock' => $variant->stock_qty > 0,
                    ])->values(),
                ];
            })
            ->all();
    }

    private function unavailable(): HttpResponse
    {
        return Inertia::render('public/catalog-unavailable')->toResponse(request())->setStatusCode(404);
    }
}
