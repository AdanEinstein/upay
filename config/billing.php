<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Platform subscription billing
    |--------------------------------------------------------------------------
    |
    | Merchants pay their plan with a static PIX to the platform's own key.
    | An empty key (BILLING_PIX_KEY=) means "not configured": the merchant
    | billing screen then shows no QR and points to support instead.
    |
    | lead_days:  invoice is created this many days before the period ends.
    | grace_days: days after the due date before an unpaid store is suspended.
    | trial_days: days a new store has before its first invoice falls due.
    |
    */

    'pix_key' => env('BILLING_PIX_KEY') ?: null,
    'pix_key_type' => env('BILLING_PIX_KEY_TYPE', 'random'),
    'merchant_name' => env('BILLING_MERCHANT_NAME') ?: env('APP_NAME', 'Upay'),
    'lead_days' => (int) env('BILLING_LEAD_DAYS', 5),
    'grace_days' => (int) env('BILLING_GRACE_DAYS', 7),
    'trial_days' => (int) env('BILLING_TRIAL_DAYS', 7),
];
