<?php

namespace App\Support;

use App\Models\Organization;

class Tenant
{
    protected static ?Organization $current = null;

    public static function use(Organization $organization): void
    {
        static::$current = $organization;
    }

    public static function forget(): void
    {
        static::$current = null;
    }

    public static function current(): ?Organization
    {
        return static::$current;
    }

    public static function id(): ?int
    {
        return static::$current?->id;
    }

    public static function check(): bool
    {
        return static::$current !== null;
    }
}
