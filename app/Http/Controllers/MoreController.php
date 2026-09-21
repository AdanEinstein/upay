<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\ShopSetting;
use App\Support\Tenant;
use Inertia\Inertia;
use Inertia\Response;

class MoreController extends Controller
{
    public function __invoke(): Response
    {
        $organization = Tenant::current();
        $plan = $organization->subscription?->plan;

        return Inertia::render('more', [
            'pixKey' => ShopSetting::query()->value('pix_key'),
            'supportWhatsapp' => config('services.support.whatsapp'),
            'plan' => $plan ? [
                'name' => $plan->name,
                'usage' => [
                    ['key' => 'customers', 'used' => $organization->customerCount(), 'limit' => $plan->limits['max_customers'] ?? null],
                    ['key' => 'products', 'used' => Product::query()->count(), 'limit' => $plan->limits['max_products'] ?? null],
                    ['key' => 'sales', 'used' => Sale::query()->where('sold_at', '>=', now()->startOfMonth())->count(), 'limit' => $plan->limits['max_sales_per_month'] ?? null],
                ],
            ] : null,
        ]);
    }
}
