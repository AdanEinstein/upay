<?php

use App\Enums\OrganizationStatus;
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
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('status')->default(OrganizationStatus::Active->value);
            $table->string('logo_path')->nullable();
            $table->string('favicon_path')->nullable();
            $table->string('accent_color')->default('#3667f6');
            $table->string('accent_color_hover')->default('#2454e0');
            $table->string('accent_color_soft')->default('#eef3ff');
            $table->string('on_primary_color')->default('#ffffff');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
