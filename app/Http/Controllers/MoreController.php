<?php

namespace App\Http\Controllers;

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
                'usage' => $organization->planUsage(),
            ] : null,
        ]);
    }
}
