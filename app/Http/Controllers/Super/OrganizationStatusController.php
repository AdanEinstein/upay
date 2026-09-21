<?php

namespace App\Http\Controllers\Super;

use App\Enums\OrganizationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Super\OrganizationStatusRequest;
use App\Models\Organization;
use Illuminate\Http\RedirectResponse;

class OrganizationStatusController extends Controller
{
    public function __invoke(OrganizationStatusRequest $request, Organization $organization): RedirectResponse
    {
        $status = $request->enum('status', OrganizationStatus::class);

        $organization->update([
            'status' => $status,
            'suspension_reason' => $status === OrganizationStatus::Suspended ? $request->validated('reason') : null,
        ]);

        return to_route('super-admin.organizations.index');
    }
}
