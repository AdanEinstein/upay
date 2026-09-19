<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Platform Super Admin
    |--------------------------------------------------------------------------
    |
    | The platform has exactly one super admin. It is not a row in the
    | "users" table — keeping it out of that table avoids every tenant-scoped
    | query having to special-case a user with no organization. Credentials
    | live in the environment; the configured email is the user's stable id.
    |
    | The password is stored as a bcrypt hash, never plaintext. Generate one
    | with: php artisan tinker --execute='echo Hash::make("your-password");'
    |
    */

    'name' => env('SUPER_ADMIN_NAME', 'Super Admin'),
    'email' => env('SUPER_ADMIN_EMAIL', 'super@example.com'),
    'password_hash' => env('SUPER_ADMIN_PASSWORD_HASH'),
];
