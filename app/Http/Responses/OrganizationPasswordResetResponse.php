<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\PasswordResetResponse as PasswordResetResponseContract;

class OrganizationPasswordResetResponse implements PasswordResetResponseContract
{
    public function toResponse($request): mixed
    {
        return redirect()->route('login', ['organization' => $request->route('organization')])
            ->with('status', __('Your password has been reset.'));
    }
}
