<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds form1_data JSON column to households table to persist Form 1
     * (Father Profile, Mother Profile, and Family Profile) during offline sync.
     */
    public function up(): void
    {
        if (Schema::hasTable('households') && !Schema::hasColumn('households', 'form1_data')) {
            Schema::table('households', function (Blueprint $table) {
                $table->json('form1_data')->nullable()->after('mapped_by');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('households') && Schema::hasColumn('households', 'form1_data')) {
            Schema::table('households', function (Blueprint $table) {
                $table->dropColumn('form1_data');
            });
        }
    }
};
