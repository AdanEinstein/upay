<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class OrganizationLoginResponse implements LoginResponseContract
{
    public function toResponse($request): mixed
    {
        return redirect()->route('dashboard', ['organization' => $request->user()->organization->slug]);
    }
}
