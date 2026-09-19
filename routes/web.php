<?php

use App\Http\Controllers\OrganizationSettingsController;
use App\Http\Middleware\SetOrganizationContext;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

require __DIR__.'/super-admin.php';

Route::middleware(['auth', SetOrganizationContext::class])
    ->prefix('{organization}')
    ->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');

        Route::get('organization-settings', [OrganizationSettingsController::class, 'edit'])->name('organization-settings.edit');
        Route::put('organization-settings', [OrganizationSettingsController::class, 'update'])->name('organization-settings.update');

        require __DIR__.'/settings.php';
    });

// Registered after the tenant group so an organization slug always wins over `/p/...`.
// The token maps to `customers.public_token` (see docs/database-schema.md).
Route::inertia('p/{token}', 'public/debt')->name('public.debt');
