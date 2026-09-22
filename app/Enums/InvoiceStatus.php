<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case Open = 'open';
    case Claimed = 'claimed';
    case Paid = 'paid';
    case Canceled = 'canceled';
}
