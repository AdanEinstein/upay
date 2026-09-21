<?php

namespace App\Http\Controllers;

use App\Http\Requests\OnboardingRequest;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ShopSetting;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('onboarding', [
            'organization' => [
                'name' => Tenant::current()->name,
            ],
        ]);
    }

    public function store(OnboardingRequest $request): RedirectResponse
    {
        $organization = Tenant::current();

        DB::transaction(function () use ($request, $organization): void {
            if ($request->filled('name')) {
                $organization->name = $request->validated('name');
            }

            if ($request->hasFile('logo')) {
                $organization->logo_path = $request->file('logo')->store('organizations/'.$organization->id, 'public');
            }

            $organization->save();

            if ($request->filled('product_name')) {
                $product = Product::create([
                    'name' => $request->validated('product_name'),
                    'price_cents' => $request->validated('product_price_cents'),
                ]);

                if ($request->hasFile('product_photo')) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'path' => $request->file('product_photo')->store('products/'.$organization->id, 'public'),
                        'position' => 0,
                    ]);
                }
            }

            ShopSetting::updateOrCreate([], [
                'pix_key_type' => $request->validated('pix_key_type'),
                'pix_key' => $request->validated('pix_key'),
            ]);
        });

        return to_route('dashboard');
    }
}
