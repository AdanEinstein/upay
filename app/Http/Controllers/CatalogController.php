<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Promotion;
use App\Models\ShopSetting;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function show(): Response
    {
        $settings = ShopSetting::current();
        $slug = Tenant::current()->slug;

        return Inertia::render('catalog/show', [
            'link' => parse_url(config('app.url'), PHP_URL_HOST).'/c/'.$slug,
            'published' => $settings->catalog_public,
            'activePromotions' => Promotion::query()->active()->count(),
            'noticeLive' => $settings->hasLiveNotice(),
        ]);
    }

    public function preview(): Response
    {
        $organization = Tenant::current();
        $settings = ShopSetting::current();

        return Inertia::render('catalog/preview', [
            'store' => [
                'name' => $organization->name,
                'accentColor' => $organization->accent_color,
                'logoUrl' => $organization->logo_path ? Storage::url($organization->logo_path) : null,
                'coverUrl' => $settings->cover_path ? Storage::url($settings->cover_path) : null,
                'welcomeText' => $settings->welcome_text,
            ],
            'notice' => $settings->hasLiveNotice() ? ['text' => $settings->notice_text, 'type' => $settings->notice_type->value] : null,
            'promotions' => Promotion::query()->active()->with('products.images')->get()->map(fn (Promotion $promotion) => [
                'id' => $promotion->id,
                'name' => $promotion->name,
                'type' => $promotion->type->value,
                'percent' => $promotion->percent,
                'promoPriceCents' => $promotion->promo_price_cents,
                'imageUrl' => ($path = $promotion->products->first()?->images->sortBy('position')->first()?->path) ? Storage::url($path) : null,
            ]),
            'products' => Product::query()->with('images')->where('active', true)->where('catalog_visible', true)->orderBy('name')->limit(60)->get()->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'priceCents' => $product->price_cents,
                'imageUrl' => ($path = $product->images->sortBy('position')->first()?->path) ? Storage::url($path) : null,
            ]),
        ]);
    }

    public function publish(): RedirectResponse
    {
        ShopSetting::current()->update(['catalog_public' => true]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Catalog published.')]);

        return back();
    }
}
