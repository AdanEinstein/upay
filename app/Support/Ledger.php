<?php

namespace App\Support;

use App\Models\Expense;
use App\Models\Installment;
use App\Models\Payment;
use DateTimeInterface;
use Illuminate\Support\Facades\DB;

/**
 * Cash-basis money figures for the current tenant (see docs/database-schema.md).
 */
class Ledger
{
    public static function revenue(DateTimeInterface $from, DateTimeInterface $to): int
    {
        return (int) Payment::query()->whereBetween('paid_at', [$from, $to])->sum('amount_cents');
    }

    public static function expenses(DateTimeInterface $from, DateTimeInterface $to): int
    {
        return (int) Expense::query()->whereBetween('paid_at', [$from, $to])->sum('amount_cents');
    }

    public static function profit(DateTimeInterface $from, DateTimeInterface $to): int
    {
        return static::revenue($from, $to) - static::expenses($from, $to);
    }

    /**
     * Still owed by customers on installments due up to and including `$until`.
     */
    public static function receivable(DateTimeInterface $until, ?DateTimeInterface $since = null): int
    {
        return (int) Installment::query()
            ->unpaid()
            ->whereDate('due_date', '<=', $until)
            ->when($since, fn ($query) => $query->whereDate('due_date', '>=', $since))
            ->sum(DB::raw(Installment::remainingSql()));
    }

    public static function payable(DateTimeInterface $until): int
    {
        return (int) Expense::query()
            ->whereNull('paid_at')
            ->whereDate('due_date', '<=', $until)
            ->sum('amount_cents');
    }
}
