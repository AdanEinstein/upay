<?php

namespace App\Http\Controllers;

use App\Http\Requests\CatalogIdentityRequest;
use App\Models\Organization;
use App\Models\ShopSetting;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CatalogIdentityController extends Controller
{
    public function edit(): Response
    {
        $organization = Tenant::current();
        $settings = ShopSetting::current();

        return Inertia::render('catalog/identity', [
            'name' => $organization->name,
            'slug' => $organization->slug,
            'link' => parse_url(config('app.url'), PHP_URL_HOST).'/'.$organization->slug,
            'logoUrl' => $organization->logo_path ? Storage::url($organization->logo_path) : null,
            'coverUrl' => $settings->cover_path ? Storage::url($settings->cover_path) : null,
            'welcomeText' => $settings->welcome_text ?? '',
            'whatsapp' => $settings->whatsapp ?? '',
            'accentColor' => $organization->accent_color,
            'palette' => array_keys(Organization::ACCENT_PALETTE),
        ]);
    }

    public function update(CatalogIdentityRequest $request): RedirectResponse
    {
        $organization = Tenant::current();
        $palette = Organization::ACCENT_PALETTE[$request->validated('accent_color')];

        $organization->fill([
            'name' => $request->validated('name'),
            'accent_color' => $request->validated('accent_color'),
            'accent_color_hover' => $palette['hover'],
            'accent_color_soft' => $palette['soft'],
            'on_primary_color' => $palette['on_primary'],
        ]);

        if ($request->hasFile('logo')) {
            $organization->logo_path = $request->file('logo')->store('organizations/'.$organization->id, 'public');
        }

        $organization->save();

        $settings = ShopSetting::current();
        $settings->fill($request->safe()->only(['welcome_text', 'whatsapp']));

        if ($request->hasFile('cover')) {
            $settings->cover_path = $request->file('cover')->store('organizations/'.$organization->id, 'public');
        }

        $settings->save();

        return to_route('catalog.show');
    }
}
