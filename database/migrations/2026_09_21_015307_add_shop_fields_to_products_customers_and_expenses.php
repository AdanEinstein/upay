<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('cost_cents')->nullable()->after('price_cents');
            $table->string('category')->nullable()->after('description');
            $table->boolean('catalog_visible')->default(true)->after('active');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->string('document')->nullable()->after('phone');
            $table->string('address')->nullable()->after('document');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dateTime('paid_at')->nullable()->change();
            $table->date('due_date')->nullable()->after('category');
            $table->boolean('recurring')->default(false)->after('due_date');
            $table->string('receipt_path')->nullable()->after('recurring');
        });

        DB::table('expenses')->update(['due_date' => DB::raw('DATE(paid_at)')]);
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn(['due_date', 'recurring', 'receipt_path']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['document', 'address']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['cost_cents', 'category', 'catalog_visible']);
        });
    }
};
