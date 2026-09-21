<?php

use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\OrganizationSettingsController;
use App\Http\Controllers\PlanLimitController;
use App\Http\Controllers\PublicCatalogController;
use App\Http\Controllers\PublicDebtController;
use App\Http\Controllers\PublicPaymentClaimController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\WelcomeController;
use App\Http\Middleware\SetOrganizationContext;
use Illuminate\Support\Facades\Route;

Route::get('/', WelcomeController::class)->name('home');

require __DIR__.'/super-admin.php';

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisterController::class, 'create'])->name('register');
    Route::post('register', [RegisterController::class, 'store'])->middleware('throttle:6,1')->name('register.store');
});

Route::middleware(['auth', SetOrganizationContext::class])
    ->prefix('{organization}')
    ->group(function () {
        require __DIR__.'/shop.php';

        Route::get('onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
        Route::post('onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');
        Route::get('plan-limit', PlanLimitController::class)->name('plan-limit.show');

        Route::get('organization-settings', [OrganizationSettingsController::class, 'edit'])->name('organization-settings.edit');
        Route::put('organization-settings', [OrganizationSettingsController::class, 'update'])->name('organization-settings.update');

        require __DIR__.'/settings.php';
    });

// `p` and `c` are reserved slugs (Organization::RESERVED_SLUGS), so these never collide with a tenant.
// The token maps to `customers.public_token` (see docs/database-schema.md).
Route::get('c/{slug}', [PublicCatalogController::class, 'show'])->middleware('throttle:60,1')->name('public.catalog');
Route::get('p/{token}', [PublicDebtController::class, 'show'])->middleware('throttle:60,1')->name('public.debt');
Route::post('p/{token}/installments/{installment}/claim', [PublicPaymentClaimController::class, 'store'])->middleware('throttle:10,1')->name('public.debt.claim');
