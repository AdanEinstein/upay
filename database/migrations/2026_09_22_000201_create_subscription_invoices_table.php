<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subscription_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->string('cycle')->default('monthly');
            $table->unsignedInteger('amount_cents');
            $table->date('due_date');
            $table->string('status')->default('open');
            $table->dateTime('claimed_at')->nullable();
            $table->string('receipt_path')->nullable();
            $table->string('rejection_reason')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->unique(['subscription_id', 'due_date']);
            $table->index(['status', 'due_date']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_invoices');
    }
};
