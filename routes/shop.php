<?php

use App\Http\Controllers\BillingController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CatalogIdentityController;
use App\Http\Controllers\CatalogNoticeController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerPublicLinkController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ExpensePaymentController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InstallmentPaymentController;
use App\Http\Controllers\MoreController;
use App\Http\Controllers\PayableController;
use App\Http\Controllers\PaymentClaimController;
use App\Http\Controllers\PixKeyController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductStockController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\ReceivableController;
use App\Http\Controllers\SaleController;
use App\Http\Middleware\IdempotentRequest;
use Illuminate\Support\Facades\Route;

Route::get('dashboard', HomeController::class)->name('dashboard');

Route::resource('sales', SaleController::class)->only(['index', 'create', 'store', 'show', 'destroy'])
    ->middlewareFor('store', IdempotentRequest::class);
Route::post('installments/{installment}/payments', [InstallmentPaymentController::class, 'store'])->middleware(IdempotentRequest::class)->name('installments.payments.store');
Route::post('payment-claims/{claim}/confirm', [PaymentClaimController::class, 'confirm'])->name('payment-claims.confirm');
Route::post('payment-claims/{claim}/reject', [PaymentClaimController::class, 'reject'])->name('payment-claims.reject');
Route::get('payment-claims/{claim}/receipt', [PaymentClaimController::class, 'receipt'])->name('payment-claims.receipt');
Route::get('receivables', ReceivableController::class)->name('receivables.index');

Route::resource('customers', CustomerController::class)->except(['destroy'])
    ->middlewareFor(['store', 'update'], IdempotentRequest::class);
Route::post('customers/{customer}/public-link', CustomerPublicLinkController::class)->name('customers.public-link.regenerate');

Route::resource('products', ProductController::class)->except(['destroy']);
Route::post('products/{product}/stock', [ProductStockController::class, 'store'])->middleware(IdempotentRequest::class)->name('products.stock.store');

Route::get('finance', FinanceController::class)->name('finance.index');
Route::resource('expenses', ExpenseController::class)->except(['show', 'destroy']);
Route::get('expenses/{expense}/receipt', [ExpenseController::class, 'receipt'])->name('expenses.receipt');
Route::post('expenses/{expense}/pay', ExpensePaymentController::class)->middleware(IdempotentRequest::class)->name('expenses.pay');
Route::get('payables', PayableController::class)->name('payables.index');

Route::get('catalog', [CatalogController::class, 'show'])->name('catalog.show');
Route::get('catalog/preview', [CatalogController::class, 'preview'])->name('catalog.preview');
Route::put('catalog/publish', [CatalogController::class, 'publish'])->name('catalog.publish');
Route::get('catalog/identity', [CatalogIdentityController::class, 'edit'])->name('catalog.identity.edit');
Route::post('catalog/identity', [CatalogIdentityController::class, 'update'])->name('catalog.identity.update');
Route::get('catalog/notice', [CatalogNoticeController::class, 'edit'])->name('catalog.notice.edit');
Route::put('catalog/notice', [CatalogNoticeController::class, 'update'])->name('catalog.notice.update');
Route::resource('promotions', PromotionController::class)->except(['show']);

Route::get('more', MoreController::class)->name('more.show');
Route::get('pix-key', [PixKeyController::class, 'edit'])->name('pix-key.edit');
Route::put('pix-key', [PixKeyController::class, 'update'])->name('pix-key.update');

Route::get('billing', [BillingController::class, 'show'])->name('billing.show');
Route::post('billing/invoices/{invoice}/claim', [BillingController::class, 'claim'])->name('billing.claim');
