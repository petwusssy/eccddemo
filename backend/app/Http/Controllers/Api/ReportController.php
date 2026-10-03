<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    protected ReportService $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * Parse query filters
     */
    protected function parseFilters(Request $request): array
    {
        return [
            'year' => $request->query('year', 'all'),
            'barangay' => $request->query('barangay', 'all'),
            'dayCareCenter' => $request->query('dayCareCenter', 'all'),
            'age' => $request->query('age', 'all'),
            'status' => $request->query('status', 'all'),
            'startDate' => $request->query('startDate', null),
            'endDate' => $request->query('endDate', null),
        ];
    }

    /**
     * GET /api/reports/mapping
     */
    public function mapping(Request $request): JsonResponse
    {
        $data = $this->reportService->getMappingReport($this->parseFilters($request));
        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /api/reports/enrollment
     */
    public function enrollment(Request $request): JsonResponse
    {
        $data = $this->reportService->getEnrollmentReport($this->parseFilters($request));
        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /api/reports/not-enrolled
     */
    public function notEnrolled(Request $request): JsonResponse
    {
        $data = $this->reportService->getChildrenNotEnrolledReport($this->parseFilters($request));
        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /api/reports/health
     */
    public function health(Request $request): JsonResponse
    {
        $data = $this->reportService->getHealthReport($this->parseFilters($request));
        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /api/reports/development
     */
    public function development(Request $request): JsonResponse
    {
        $data = $this->reportService->getDevelopmentReport($this->parseFilters($request));
        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /api/reports/follow-ups
     */
    public function followUps(Request $request): JsonResponse
    {
        $data = $this->reportService->getFollowUpsReport($this->parseFilters($request));
        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /api/reports/barangay-summary
     */
    public function barangaySummary(Request $request): JsonResponse
    {
        $data = $this->reportService->getBarangaySummaryReport($this->parseFilters($request));
        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /api/reports/consolidated-family
     */
    public function consolidatedFamily(Request $request): JsonResponse
    {
        $data = $this->reportService->getConsolidatedFamilyReport($this->parseFilters($request));
        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /api/reports/consolidated-children
     */
    public function consolidatedChildren(Request $request): JsonResponse
    {
        $data = $this->reportService->getConsolidatedChildrenReport($this->parseFilters($request));
        return response()->json(['success' => true, 'data' => $data]);
    }
}
