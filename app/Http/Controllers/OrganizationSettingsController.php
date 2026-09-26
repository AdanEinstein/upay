<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrganizationSettingsUpdateRequest;
use App\Models\Organization;
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
            'defaultColors' => Organization::DEFAULT_COLORS,
        ]);
    }

    public function update(OrganizationSettingsUpdateRequest $request): RedirectResponse
    {
        $organization = Tenant::current();

        $organization->fill($request->safe()->only([
            'name', 'accent_color', 'accent_color_hover', 'accent_color_soft', 'on_primary_color',
        ]));

        foreach (['logo', 'favicon'] as $image) {
            $column = $image.'_path';

            if ($request->hasFile($image)) {
                $organization->{$column} = $request->file($image)->store('organizations/'.$organization->id, 'public');
            } elseif ($request->boolean('remove_'.$image) && $organization->{$column}) {
                Storage::disk('public')->delete($organization->{$column});
                $organization->{$column} = null;
            }
        }

        $iconColorsChanged = $organization->isDirty(['accent_color', 'on_primary_color']);
        $organization->save();

        Inertia::flash('toast', array_filter([
            'type' => 'success',
            'message' => __('Organization settings updated.'),
            'description' => $iconColorsChanged ? __('The installed app switches to the new color the next time it is opened. It can take up to a day, and the phone may ask you to confirm.') : null,
        ]));

        return back();
    }
}
