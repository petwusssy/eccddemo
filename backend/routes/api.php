<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentUploadController;
use App\Http\Controllers\Api\UserManagementController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication (JWT) API Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
});

/*
|--------------------------------------------------------------------------
| AWS S3 File Storage & Document Upload API Routes
|--------------------------------------------------------------------------
*/
Route::post('/upload-s3', [DocumentUploadController::class, 'upload']);
Route::get('/test-s3', [DocumentUploadController::class, 'testS3']);

/*
|--------------------------------------------------------------------------
| API Routes — ECCD CARE System
|--------------------------------------------------------------------------
| Dashboard API Contract:
| GET /api/dashboard/summary
| GET /api/dashboard/enrollment
| GET /api/dashboard/monitoring
| GET /api/dashboard/barangays
| GET /api/dashboard/attention
| GET /api/dashboard/recent-activity
*/

Route::prefix('dashboard')->group(function () {
    Route::get('/summary', [DashboardController::class, 'summary']);
    Route::get('/enrollment', [DashboardController::class, 'enrollment']);
    Route::get('/monitoring', [DashboardController::class, 'monitoring']);
    Route::get('/barangays', [DashboardController::class, 'barangays']);
    Route::get('/attention', [DashboardController::class, 'attention']);
    Route::get('/recent-activity', [DashboardController::class, 'recentActivity']);
});

/*
|--------------------------------------------------------------------------
| Community Mapping API Contract:
| POST /api/mapping/activities
| GET  /api/mapping/activities
| GET  /api/mapping/activities/{id}
| POST /api/mapping/activities/{id}/assignments
| POST /api/households
| GET  /api/households
| GET  /api/households/{id}
| POST /api/children
| GET  /api/children/search
| GET  /api/children/{id}
| POST /api/mapping/children
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Api\CommunityMappingController;

Route::prefix('mapping')->group(function () {
    Route::get('/activities', [CommunityMappingController::class, 'getActivities']);
    Route::post('/activities', [CommunityMappingController::class, 'createActivity']);
    Route::get('/activities/{id}', [CommunityMappingController::class, 'getActivityById']);
    Route::post('/activities/{id}/assignments', [CommunityMappingController::class, 'assignWorkers']);
    Route::post('/children', [CommunityMappingController::class, 'createChild']);
    Route::post('/sync', [CommunityMappingController::class, 'syncBatch']);
});

Route::prefix('households')->group(function () {
    Route::get('/', [CommunityMappingController::class, 'getHouseholds']);
    Route::post('/', [CommunityMappingController::class, 'createHousehold']);
    Route::get('/{id}', [CommunityMappingController::class, 'getHouseholdById']);
});

use App\Http\Controllers\Api\ChildManagementController;

Route::prefix('children')->group(function () {
    Route::get('/', [ChildManagementController::class, 'index']);
    Route::post('/', [ChildManagementController::class, 'store']);
    Route::get('/search', [CommunityMappingController::class, 'searchChildren']);
    Route::get('/{id}', [ChildManagementController::class, 'show']);
    Route::put('/{id}', [ChildManagementController::class, 'update']);
    Route::get('/{id}/timeline', [ChildManagementController::class, 'timeline']);
    Route::get('/{id}/household', [ChildManagementController::class, 'household']);
    Route::get('/{id}/status', [ChildManagementController::class, 'status']);
});

use App\Http\Controllers\Api\EnrollmentController;

Route::prefix('enrollments')->group(function () {
    Route::get('/', [EnrollmentController::class, 'index']);
    Route::get('/not-enrolled', [EnrollmentController::class, 'notEnrolled']);
    Route::post('/', [EnrollmentController::class, 'store']);
    Route::put('/{id}', [EnrollmentController::class, 'update']);
});

Route::get('/children/{id}/enrollment', [EnrollmentController::class, 'childEnrollment']);

use App\Http\Controllers\Api\HealthMonitoringController;

Route::prefix('health-monitoring')->group(function () {
    Route::get('/due', [HealthMonitoringController::class, 'due']);
    Route::put('/{id}', [HealthMonitoringController::class, 'update']);
});

Route::get('/children/{id}/health', [HealthMonitoringController::class, 'getChildHealth']);
Route::post('/children/{id}/health', [HealthMonitoringController::class, 'recordChildHealth']);

/*
|--------------------------------------------------------------------------
| Development / ECCD Checklist Assessment API Contract:
| GET  /api/development/assessments
| GET  /api/children/:id/development
| POST /api/children/:id/development
| GET  /api/development/reference
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Api\DevelopmentAssessmentController;

Route::prefix('development')->group(function () {
    Route::get('/assessments', [DevelopmentAssessmentController::class, 'index']);
    Route::get('/reference', [DevelopmentAssessmentController::class, 'reference']);
});

Route::get('/children/{id}/development', [DevelopmentAssessmentController::class, 'getChildDevelopment']);
Route::post('/children/{id}/development', [DevelopmentAssessmentController::class, 'recordAssessment']);

/*
|--------------------------------------------------------------------------
| Follow-up / Early Support API Contract:
| GET  /api/follow-ups
| GET  /api/follow-ups/needs-attention
| POST /api/follow-ups
| PUT  /api/follow-ups/:id
| POST /api/follow-ups/:id/resolve
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Api\FollowUpController;

Route::prefix('follow-ups')->group(function () {
    Route::get('/', [FollowUpController::class, 'index']);
    Route::get('/needs-attention', [FollowUpController::class, 'needsAttention']);
    Route::post('/', [FollowUpController::class, 'store']);
    Route::put('/{id}', [FollowUpController::class, 'update']);
    Route::post('/{id}/resolve', [FollowUpController::class, 'resolve']);
    Route::get('/{id}/case-view', [FollowUpController::class, 'caseView']);
});

/*
|--------------------------------------------------------------------------
| Community Management API Contract:
| GET /api/barangays
| GET /api/barangays/:id
| GET /api/centers
| GET /api/centers/:id
| GET /api/workers
| GET /api/workers/:id
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Api\CommunityController;

Route::prefix('barangays')->group(function () {
    Route::get('/', [CommunityController::class, 'getBarangays']);
    Route::get('/{id}', [CommunityController::class, 'getBarangayById']);
});

Route::prefix('centers')->group(function () {
    Route::get('/', [CommunityController::class, 'getCenters']);
    Route::get('/{id}', [CommunityController::class, 'getCenterById']);
});

Route::prefix('workers')->group(function () {
    Route::get('/', [CommunityController::class, 'getWorkers']);
    Route::get('/{id}', [CommunityController::class, 'getWorkerById']);
});

/*
|--------------------------------------------------------------------------
| Reports API Contract:
| GET /api/reports/mapping
| GET /api/reports/enrollment
| GET /api/reports/not-enrolled
| GET /api/reports/health
| GET /api/reports/development
| GET /api/reports/follow-ups
| GET /api/reports/barangay-summary
| GET /api/reports/consolidated-family
| GET /api/reports/consolidated-children
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Api\ReportController;

Route::prefix('reports')->group(function () {
    Route::get('/mapping', [ReportController::class, 'mapping']);
    Route::get('/enrollment', [ReportController::class, 'enrollment']);
    Route::get('/not-enrolled', [ReportController::class, 'notEnrolled']);
    Route::get('/health', [ReportController::class, 'health']);
    Route::get('/development', [ReportController::class, 'development']);
    Route::get('/follow-ups', [ReportController::class, 'followUps']);
    Route::get('/barangay-summary', [ReportController::class, 'barangaySummary']);
    Route::get('/consolidated-family', [ReportController::class, 'consolidatedFamily']);
    Route::get('/consolidated-children', [ReportController::class, 'consolidatedChildren']);
});

/*
|--------------------------------------------------------------------------
| Resources API Contract:
| GET /api/resources
| GET /api/resources/{id}
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Api\ResourceController;

Route::prefix('resources')->group(function () {
    Route::get('/', [ResourceController::class, 'index']);
    Route::get('/{id}', [ResourceController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| System Governance & Audit Log API Contract:
| GET  /api/audit-logs
| POST /api/audit-logs
| GET  /api/governance/roles
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Api\AuditLogController;

Route::prefix('audit-logs')->group(function () {
    Route::get('/', [AuditLogController::class, 'index']);
    Route::post('/', [AuditLogController::class, 'store']);
});

Route::prefix('governance')->group(function () {
    Route::get('/roles', [AuditLogController::class, 'roles']);
});

/*
|--------------------------------------------------------------------------
| Roles & User Management REST Endpoints (IT Admin & System Control)
|--------------------------------------------------------------------------
*/
Route::get('/roles', [UserManagementController::class, 'roles']);
Route::prefix('users')->group(function () {
    Route::get('/', [UserManagementController::class, 'index']);
    Route::post('/', [UserManagementController::class, 'store']);
    Route::get('/{id}', [UserManagementController::class, 'show']);
    Route::put('/{id}', [UserManagementController::class, 'update']);
    Route::post('/{id}/reset-password', [UserManagementController::class, 'resetPassword']);
    Route::delete('/{id}', [UserManagementController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| REST DELETE Endpoints for Core Relational Entities
|--------------------------------------------------------------------------
*/
Route::delete('/children/{id}', [ChildManagementController::class, 'destroy'])->name('children.destroy');
Route::delete('/households/{id}', [CommunityMappingController::class, 'destroyHousehold'])->name('households.destroy');
Route::delete('/enrollments/{id}', [EnrollmentController::class, 'destroy'])->name('enrollments.destroy');
Route::delete('/health-monitoring/{id}', [HealthMonitoringController::class, 'destroy'])->name('health-monitoring.destroy');
Route::delete('/follow-ups/{id}', [FollowUpController::class, 'destroy'])->name('follow-ups.destroy');
Route::delete('/resources/{id}', [ResourceController::class, 'destroy'])->name('resources.destroy');

/*
|--------------------------------------------------------------------------
| System & Database Reset API Endpoint (1-Click Fresh State for Demo)
|--------------------------------------------------------------------------
*/
Route::post('/system/reset-demo-data', function () {
    try {
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        \App\Models\Child::truncate();
        \App\Models\Household::truncate();
        \App\Models\Enrollment::truncate();
        \App\Models\HealthMonitoring::truncate();
        \App\Models\DevelopmentAssessment::truncate();
        \App\Models\FollowUp::truncate();

        if (\Illuminate\Support\Facades\Schema::hasTable('health_records')) {
            \Illuminate\Support\Facades\DB::table('health_records')->truncate();
        }
        if (\Illuminate\Support\Facades\Schema::hasTable('interventions')) {
            \Illuminate\Support\Facades\DB::table('interventions')->truncate();
        }
        if (\Illuminate\Support\Facades\Schema::hasTable('mapping_activity_workers')) {
            \Illuminate\Support\Facades\DB::table('mapping_activity_workers')->truncate();
        }
        if (\Illuminate\Support\Facades\Schema::hasTable('mapping_activities')) {
            \App\Models\MappingActivity::truncate();
        }
        if (\Illuminate\Support\Facades\Schema::hasTable('audit_logs')) {
            \App\Models\AuditLog::truncate();
        }

        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Re-seed default mapping activity and barangays
        $bSeeder = new \Database\Seeders\BarangaySeeder();
        $bSeeder->run();

        // Re-seed default users and roles
        $uSeeder = new \Database\Seeders\UserSeeder();
        $uSeeder->run();

        // Persist fresh reset token across devices
        $newToken = (string)time();
        @file_put_contents(storage_path('framework/system_reset_token.txt'), $newToken);

        return response()->json([
            'ok' => true,
            'status' => 200,
            'reset_token' => $newToken,
            'message' => 'Database successfully reset to 0 operational records.',
            'data' => [
                'children' => 0,
                'households' => 0,
                'enrollments' => 0,
            ],
        ]);
    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        return response()->json([
            'ok' => false,
            'status' => 500,
            'error' => 'Reset failed: ' . $e->getMessage(),
        ], 500);
    }
});

Route::get('/system/status', function () {
    $tokenPath = storage_path('framework/system_reset_token.txt');
    $token = file_exists($tokenPath) ? trim((string)file_get_contents($tokenPath)) : '1';
    return response()->json([
        'ok' => true,
        'status' => 200,
        'reset_token' => $token,
        'total_children' => \App\Models\Child::count(),
        'total_households' => \App\Models\Household::count(),
    ]);
});
