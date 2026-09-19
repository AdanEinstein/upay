<?php

namespace App\Http\Controllers\Super;

use App\Enums\OrganizationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Super\OrganizationStoreRequest;
use App\Http\Requests\Super\OrganizationUpdateRequest;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
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
            'statuses' => array_column(OrganizationStatus::cases(), 'value'),
            'kpis' => [
                'total' => Organization::query()->count(),
                'active' => Organization::query()->where('status', OrganizationStatus::Active)->count(),
                'suspended' => Organization::query()->where('status', OrganizationStatus::Suspended)->count(),
                'users' => User::query()->whereNotNull('organization_id')->count(),
            ],
        ]);
    }

    public function store(OrganizationStoreRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $organization = Organization::create([
                'name' => $request->validated('name'),
                'slug' => $request->validated('slug'),
            ]);

            $organization->users()->create([
                'name' => $request->validated('admin_name'),
                'email' => $request->validated('admin_email'),
                'password' => $request->validated('admin_password'),
            ]);
        });

        return to_route('super-admin.organizations.index');
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
        // users.organization_id is nullOnDelete: without this the organization's
        // users would survive as orphans holding their e-mail forever.
        DB::transaction(function () use ($organization): void {
            $organization->users()->delete();
            $organization->delete();
        });

        return to_route('super-admin.organizations.index');
    }
}
