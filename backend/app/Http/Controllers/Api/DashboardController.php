<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    /**
     * GET /api/dashboard/summary
     * Core KPI metrics and immediate answers to operational questions.
     */
    public function summary(): JsonResponse
    {
        $data = $this->dashboardService->getSummary();
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $data,
        ]);
    }

    /**
     * GET /api/dashboard/enrollment
     * Enrollment breakdown: enrolled, not enrolled, pending/unknown.
     */
    public function enrollment(): JsonResponse
    {
        $data = $this->dashboardService->getEnrollment();
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $data,
        ]);
    }

    /**
     * GET /api/dashboard/monitoring
     * Health (Up to date, Due, Overdue) and Development (Completed, Pending, Follow-up).
     */
    public function monitoring(): JsonResponse
    {
        $data = $this->dashboardService->getMonitoring();
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $data,
        ]);
    }

    /**
     * GET /api/dashboard/barangays
     * Ranked barangays visualization by priority attention.
     */
    public function barangays(): JsonResponse
    {
        $data = $this->dashboardService->getBarangays();
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $data,
        ]);
    }

    /**
     * GET /api/dashboard/attention
     * Prominent operational table of children needing urgent intervention.
     */
    public function attention(): JsonResponse
    {
        $data = $this->dashboardService->getAttention();
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $data,
        ]);
    }

    /**
     * GET /api/dashboard/recent-activity
     * Recent mapping, enrollment, health, and assessment activities.
     */
    public function recentActivity(): JsonResponse
    {
        $data = $this->dashboardService->getRecentActivity();
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $data,
        ]);
    }
}
