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
        Schema::table('health_monitorings', function (Blueprint $table) {
            $table->decimal('muac_cm', 4, 1)->nullable()->after('weight_kg');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('health_monitorings', function (Blueprint $table) {
            $table->dropColumn('muac_cm');
        });
    }
};
