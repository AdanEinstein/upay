<?php

use App\Http\Controllers\Super\OrganizationController;
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

        Route::resource('organizations', OrganizationController::class)->except('show');
    });
});
