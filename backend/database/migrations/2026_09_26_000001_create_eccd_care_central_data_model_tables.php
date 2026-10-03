<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Centralized Relational Schema for ECCD CARE
     */
    public function up(): void
    {
        // 1. Roles
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('label');
            $table->text('description')->nullable();
            $table->json('permissions')->nullable();
            $table->timestamps();
        });

        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'role_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('role_id')->nullable()->after('id')->constrained('roles')->nullOnDelete();
            });
        }

        // 2. Barangays
        Schema::create('barangays', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('district')->nullable();
            $table->string('city')->default('City of San Fernando');
            $table->unsignedInteger('under5_population')->default(0);
            $table->unsignedInteger('target_children')->default(0);
            $table->timestamps();
        });

        // 3. Day Care Centers
        Schema::create('day_care_centers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->foreignId('barangay_id')->constrained('barangays')->onDelete('cascade');
            $table->string('address');
            $table->unsignedInteger('capacity')->default(60);
            $table->unsignedInteger('enrolled_count')->default(0);
            $table->string('status')->default('Active');
            $table->string('accreditation_level')->nullable();
            $table->timestamps();
        });

        // 4. Mapping Activities
        Schema::create('mapping_activities', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('year', 4);
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedInteger('target_households')->default(0);
            $table->unsignedInteger('mapped_households')->default(0);
            $table->unsignedInteger('children_identified')->default(0);
            $table->string('status')->default('In Progress');
            $table->timestamps();
        });

        // 5. Workers
        Schema::create('workers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('role_id')->nullable()->constrained('roles')->nullOnDelete();
            $table->string('name');
            $table->string('role');
            $table->foreignId('day_care_center_id')->nullable()->constrained('day_care_centers')->nullOnDelete();
            $table->foreignId('barangay_id')->nullable()->constrained('barangays')->nullOnDelete();
            $table->string('contact')->nullable();
            $table->string('status')->default('Active');
            $table->timestamps();
        });

        // Mapping Activity Workers Pivot
        Schema::create('mapping_activity_workers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mapping_activity_id')->constrained('mapping_activities')->onDelete('cascade');
            $table->foreignId('worker_id')->constrained('workers')->onDelete('cascade');
            $table->timestamps();
        });

        // 6. Households
        Schema::create('households', function (Blueprint $table) {
            $table->id();
            $table->string('household_no')->unique();
            $table->foreignId('mapping_activity_id')->nullable()->constrained('mapping_activities')->nullOnDelete();
            $table->foreignId('barangay_id')->constrained('barangays')->onDelete('cascade');
            $table->string('purok')->nullable();
            $table->string('address');
            $table->string('parent_guardian');
            $table->string('contact_number')->nullable();
            $table->boolean('is_4ps')->default(false);
            $table->boolean('is_ip')->default(false);
            $table->string('monthly_income_class')->nullable();
            $table->date('mapped_date');
            $table->string('mapped_by')->nullable();
            $table->timestamps();
        });

        // 7. Children (Universal Persistent Entity — ECCD ID is persistent primary key)
        Schema::create('children', function (Blueprint $table) {
            $table->id();
            $table->string('eccd_id')->unique(); // Universal Persistent ID: ECCD-YYYY-NNNNNN
            $table->foreignId('household_id')->constrained('households')->onDelete('cascade');
            $table->foreignId('barangay_id')->constrained('barangays')->onDelete('cascade');
            $table->foreignId('day_care_center_id')->nullable()->constrained('day_care_centers')->nullOnDelete();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('suffix')->nullable();
            $table->date('birth_date');
            $table->enum('sex', ['Male', 'Female']);
            $table->string('blood_type', 5)->nullable();
            $table->string('philsys_card_no')->nullable();
            $table->string('psa_birth_cert')->nullable();
            $table->string('enrollment_status')->default('Not Enrolled');
            $table->string('health_status')->default('Due for Monitoring');
            $table->string('development_status')->default('Pending Initial Assessment');
            $table->boolean('has_open_follow_up')->default(false);
            $table->timestamps();

            $table->index(['first_name', 'last_name', 'birth_date']);
        });

        // 8. Enrollments (Strict: references Child eccd_id, NEVER creates duplicate child)
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->string('child_id');
            $table->foreign('child_id')->references('eccd_id')->on('children')->onDelete('cascade');
            $table->foreignId('day_care_center_id')->constrained('day_care_centers')->onDelete('cascade');
            $table->foreignId('barangay_id')->constrained('barangays')->onDelete('cascade');
            $table->string('school_year', 20);
            $table->string('program')->default('Child Development Center (CDC)');
            $table->string('session')->nullable();
            $table->date('enrollment_date');
            $table->string('status')->default('Enrolled');
            $table->foreignId('worker_id')->nullable()->constrained('workers')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        // 9. Health Monitoring (Strict: references Child eccd_id)
        Schema::create('health_monitorings', function (Blueprint $table) {
            $table->id();
            $table->string('child_id');
            $table->foreign('child_id')->references('eccd_id')->on('children')->onDelete('cascade');
            $table->date('date');
            $table->unsignedSmallInteger('age_months');
            $table->decimal('height_cm', 5, 2);
            $table->decimal('weight_kg', 5, 2);
            $table->string('nutritional_status');
            $table->string('opt_plus_class')->nullable();
            $table->boolean('deworming_done')->default(false);
            $table->boolean('vitamin_a_supplement')->default(false);
            $table->text('notes')->nullable();
            $table->string('recorded_by')->nullable();
            $table->timestamps();
        });

        // 10. Development Assessments (Strict: references Child eccd_id)
        Schema::create('development_assessments', function (Blueprint $table) {
            $table->id();
            $table->string('child_id');
            $table->foreign('child_id')->references('eccd_id')->on('children')->onDelete('cascade');
            $table->date('assessment_date');
            $table->string('assessment_type')->default('BoSY');
            $table->string('tool_version')->nullable();
            $table->string('status')->default('Completed');
            $table->foreignId('examiner_id')->nullable()->constrained('workers')->nullOnDelete();
            $table->string('examiner_name')->nullable();
            $table->unsignedSmallInteger('standard_score')->nullable();
            $table->json('scaled_scores')->nullable();
            $table->string('interpretation')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 11. Follow-ups (Strict: references Child eccd_id)
        Schema::create('follow_ups', function (Blueprint $table) {
            $table->id();
            $table->string('child_id');
            $table->foreign('child_id')->references('eccd_id')->on('children')->onDelete('cascade');
            $table->string('source_module');
            $table->text('reason');
            $table->enum('priority', ['Normal', 'High', 'Urgent'])->default('Normal');
            $table->string('status')->default('Needs Attention');
            $table->foreignId('assigned_worker_id')->nullable()->constrained('workers')->nullOnDelete();
            $table->date('scheduled_date')->nullable();
            $table->date('completed_date')->nullable();
            $table->string('action_type')->nullable();
            $table->text('action_plan')->nullable();
            $table->text('action_taken')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        // 12. Audit Logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->timestamp('timestamp')->useCurrent();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name');
            $table->string('role');
            $table->string('action');
            $table->string('module');
            $table->string('record_id')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('status')->default('Successful');
            $table->text('details')->nullable();
        });

        // 13. Resources
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category');
            $table->string('code')->unique();
            $table->string('form_number')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('Pending Integration');
            $table->string('official_doc_placeholder')->nullable();
            $table->string('file_type')->nullable();
            $table->date('last_updated')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resources');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('follow_ups');
        Schema::dropIfExists('development_assessments');
        Schema::dropIfExists('health_monitorings');
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('children');
        Schema::dropIfExists('households');
        Schema::dropIfExists('mapping_activity_workers');
        Schema::dropIfExists('workers');
        Schema::dropIfExists('mapping_activities');
        Schema::dropIfExists('day_care_centers');
        Schema::dropIfExists('barangays');
        Schema::dropIfExists('roles');
    }
};
