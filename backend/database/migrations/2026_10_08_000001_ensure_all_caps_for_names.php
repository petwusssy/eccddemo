<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Enforce ALL CAPS for all names in children and households records.
     */
    public function up(): void
    {
        if (Schema::hasTable('children')) {
            DB::statement("UPDATE children SET 
                first_name = UPPER(TRIM(first_name)),
                middle_name = CASE WHEN middle_name IS NOT NULL THEN UPPER(TRIM(middle_name)) ELSE NULL END,
                last_name = UPPER(TRIM(last_name)),
                suffix = CASE WHEN suffix IS NOT NULL THEN UPPER(TRIM(suffix)) ELSE NULL END
            ");
        }

        if (Schema::hasTable('households')) {
            DB::statement("UPDATE households SET 
                parent_guardian = UPPER(TRIM(parent_guardian))
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Uppercase data conversion is irreversible and intentional.
    }
};
