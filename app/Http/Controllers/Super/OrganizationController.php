<?php

namespace App\Http\Controllers\Super;

use App\Enums\OrganizationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Super\OrganizationStoreRequest;
use App\Http\Requests\Super\OrganizationUpdateRequest;
use App\Models\Organization;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('super/organizations', [
            'organizations' => Organization::query()
                ->withCount('users')
                ->latest()
                ->get()
                ->map(fn (Organization $organization) => [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'slug' => $organization->slug,
                    'status' => $organization->status->value,
                    'usersCount' => $organization->users_count,
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('super/organization-create');
    }

    public function store(OrganizationStoreRequest $request): RedirectResponse
    {
        Organization::create([
            'name' => $request->validated('name'),
            'slug' => $request->validated('slug'),
        ]);

        return to_route('super-admin.organizations.index');
    }

    public function edit(Organization $organization): Response
    {
        return Inertia::render('super/organization-edit', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'slug' => $organization->slug,
                'status' => $organization->status->value,
            ],
            'statuses' => array_column(OrganizationStatus::cases(), 'value'),
        ]);
    }

    public function update(OrganizationUpdateRequest $request, Organization $organization): RedirectResponse
    {
        $organization->update([
            'name' => $request->validated('name'),
            'slug' => $request->validated('slug'),
            'status' => $request->validated('status'),
        ]);

        return to_route('super-admin.organizations.index');
    }

    public function destroy(Organization $organization): RedirectResponse
    {
        $organization->delete();

        return to_route('super-admin.organizations.index');
    }
}
