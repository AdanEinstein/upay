<?php

namespace App\Http\Responses;

use App\Support\Tenant;
use Laravel\Fortify\Contracts\PasswordResetResponse as PasswordResetResponseContract;

class OrganizationPasswordResetResponse implements PasswordResetResponseContract
{
    public function toResponse($request): mixed
    {
        return redirect()->route('login', ['organization' => Tenant::current()->slug])
            ->with('status', __('Your password has been reset.'));
    }
}
