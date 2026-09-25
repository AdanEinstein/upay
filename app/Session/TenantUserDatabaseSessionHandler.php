<?php

namespace App\Session;

use Illuminate\Session\DatabaseSessionHandler;

/**
 * Records only tenant users (guard "web") in sessions.user_id. The default
 * handler asks the default guard, which `auth:super_admin` switches to the
 * super admin, whose identifier is an email — not a valid bigint.
 */
class TenantUserDatabaseSessionHandler extends DatabaseSessionHandler
{
    protected function userId(): mixed
    {
        return $this->container->make('auth')->guard('web')->id();
    }
}
