<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;

class OrganizationLogoutResponse implements LogoutResponseContract
{
    public function toResponse($request): mixed
    {
        return redirect()->route('home');
    }
}
