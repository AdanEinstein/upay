<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('organization.{organizationId}', fn (User $user, int $organizationId): bool => $user->organization_id === $organizationId);
