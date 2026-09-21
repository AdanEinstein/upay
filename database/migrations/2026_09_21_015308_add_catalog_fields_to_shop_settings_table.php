<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shop_settings', function (Blueprint $table) {
            $table->text('welcome_text')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('cover_path')->nullable();
            $table->string('notice_text', 120)->nullable();
            $table->string('notice_type')->default('info');
            $table->date('notice_expires_on')->nullable();
            $table->boolean('notice_active')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('shop_settings', function (Blueprint $table) {
            $table->dropColumn(['welcome_text', 'whatsapp', 'cover_path', 'notice_text', 'notice_type', 'notice_expires_on', 'notice_active']);
        });
    }
};
