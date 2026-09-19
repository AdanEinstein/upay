<?php

namespace App\Auth;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Support\Facades\Hash;

class SuperAdminUserProvider implements UserProvider
{
    public function retrieveById($identifier): ?Authenticatable
    {
        return hash_equals((string) config('super-admin.email'), (string) $identifier)
            ? $this->user()
            : null;
    }

    public function retrieveByToken($identifier, $token): ?Authenticatable
    {
        return null;
    }

    public function updateRememberToken(Authenticatable $user, $token): void
    {
        //
    }

    /** @param array<string, mixed> $credentials */
    public function retrieveByCredentials(array $credentials): ?Authenticatable
    {
        $email = $credentials['email'] ?? null;

        return is_string($email) && strcasecmp($email, (string) config('super-admin.email')) === 0
            ? $this->user()
            : null;
    }

    /** @param array<string, mixed> $credentials */
    public function validateCredentials(Authenticatable $user, array $credentials): bool
    {
        $password = $credentials['password'] ?? null;
        $hash = config('super-admin.password_hash');

        return is_string($password)
            && is_string($hash)
            && $hash !== ''
            && Hash::check($password, $hash);
    }

    /** @param array<string, mixed> $credentials */
    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false): void
    {
        //
    }

    private function user(): SuperAdminUser
    {
        return new SuperAdminUser([
            'id' => config('super-admin.email'),
            'name' => config('super-admin.name'),
            'email' => config('super-admin.email'),
            'remember_token' => null,
        ]);
    }
}
