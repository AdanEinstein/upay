<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrganizationSettingsUpdateRequest;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationSettingsController extends Controller
{
    public function edit(): Response
    {
        $organization = Tenant::current();

        return Inertia::render('admin/organization-settings', [
            'organization' => [
                'name' => $organization->name,
                'slug' => $organization->slug,
                'logoUrl' => $organization->logo_path ? Storage::url($organization->logo_path) : null,
                'faviconUrl' => $organization->favicon_path ? Storage::url($organization->favicon_path) : null,
                'accentColor' => $organization->accent_color,
                'accentColorHover' => $organization->accent_color_hover,
                'accentColorSoft' => $organization->accent_color_soft,
                'onPrimaryColor' => $organization->on_primary_color,
            ],
        ]);
    }

    public function update(OrganizationSettingsUpdateRequest $request): RedirectResponse
    {
        $organization = Tenant::current();

        $organization->fill($request->safe()->only([
            'name', 'accent_color', 'accent_color_hover', 'accent_color_soft', 'on_primary_color',
        ]));

        if ($request->hasFile('logo')) {
            $organization->logo_path = $request->file('logo')->store('organizations/'.$organization->id, 'public');
        }

        if ($request->hasFile('favicon')) {
            $organization->favicon_path = $request->file('favicon')->store('organizations/'.$organization->id, 'public');
        }

        $organization->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Organization settings updated.')]);

        return back();
    }
}
