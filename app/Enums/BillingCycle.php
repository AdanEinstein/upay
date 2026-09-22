<?php

namespace App\Enums;

enum BillingCycle: string
{
    case Monthly = 'monthly';
    case Annual = 'annual';

    public function months(): int
    {
        return match ($this) {
            self::Monthly => 1,
            self::Annual => 12,
        };
    }
}
