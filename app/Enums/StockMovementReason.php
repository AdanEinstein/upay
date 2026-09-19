<?php

namespace App\Enums;

enum StockMovementReason: string
{
    case Sale = 'sale';
    case Adjustment = 'adjustment';
    case Return = 'return';
}
