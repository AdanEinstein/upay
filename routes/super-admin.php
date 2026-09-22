<?php

use App\Http\Controllers\Super\DashboardController;
use App\Http\Controllers\Super\ErrorOccurrenceController;
use App\Http\Controllers\Super\OrganizationController;
use App\Http\Controllers\Super\OrganizationStatusController;
use App\Http\Controllers\Super\OrganizationSubscriptionController;
use App\Http\Controllers\Super\PlanController;
use App\Http\Controllers\Super\SubscriptionInvoiceController;
use App\Http\Controllers\SuperAdminController;
use Illuminate\Support\Facades\Route;

Route::prefix('super-admin')->name('super-admin.')->group(function () {
    Route::middleware('guest:super_admin')->group(function () {
        Route::get('/', [SuperAdminController::class, 'create'])->name('login');
        Route::post('/', [SuperAdminController::class, 'store'])
            ->middleware('throttle:super-admin-login')
            ->name('login.store');
    });

    Route::middleware('auth:super_admin')->group(function () {
        Route::post('logout', [SuperAdminController::class, 'destroy'])->name('logout');

        Route::get('dashboard', DashboardController::class)->name('dashboard');

        Route::resource('organizations', OrganizationController::class)
            ->only(['index', 'store', 'update', 'destroy']);
        Route::put('organizations/{organization}/status', OrganizationStatusController::class)->name('organizations.status.update');
        Route::put('organizations/{organization}/subscription', OrganizationSubscriptionController::class)->name('organizations.subscription.update');

        Route::resource('plans', PlanController::class)->only(['index', 'store', 'update']);

        Route::get('billing', [SubscriptionInvoiceController::class, 'index'])->name('billing.index');
        Route::post('billing/{invoice}/approve', [SubscriptionInvoiceController::class, 'approve'])->name('billing.approve');
        Route::post('billing/{invoice}/reject', [SubscriptionInvoiceController::class, 'reject'])->name('billing.reject');
        Route::get('billing/{invoice}/receipt', [SubscriptionInvoiceController::class, 'receipt'])->name('billing.receipt');

        Route::get('errors', [ErrorOccurrenceController::class, 'index'])->name('errors.index');
    });
});
