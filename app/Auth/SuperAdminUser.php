<?php

namespace App\Auth;

use Illuminate\Auth\GenericUser;

class SuperAdminUser extends GenericUser
{
    public function isSuperAdmin(): bool
    {
        return true;
    }
}
