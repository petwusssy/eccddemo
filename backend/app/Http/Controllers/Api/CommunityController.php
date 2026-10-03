<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CommunityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    protected CommunityService $communityService;

    public function __construct(CommunityService $communityService)
    {
        $this->communityService = $communityService;
    }

    /**
     * GET /api/barangays
     */
    public function getBarangays(Request $request): JsonResponse
    {
        $filters = [
            'search' => $request->query('search', ''),
        ];

        $data = $this->communityService->getBarangays($filters);

        return response()->json([
            'success' => true,
            'message' => 'Barangays retrieved successfully.',
            'data' => $data,
        ]);
    }

    /**
     * GET /api/barangays/{id}
     */
    public function getBarangayById(string $id): JsonResponse
    {
        $data = $this->communityService->getBarangayById($id);

        if (!$data) {
            return response()->json([
                'success' => false,
                'error' => "Barangay not found: {$id}",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * GET /api/centers
     */
    public function getCenters(Request $request): JsonResponse
    {
        $filters = [
            'barangay' => $request->query('barangay', 'all'),
            'search' => $request->query('search', ''),
        ];

        $data = $this->communityService->getCenters($filters);

        return response()->json([
            'success' => true,
            'message' => 'Day care centers retrieved successfully.',
            'data' => $data,
        ]);
    }

    /**
     * GET /api/centers/{id}
     */
    public function getCenterById(string $id): JsonResponse
    {
        $data = $this->communityService->getCenterById($id);

        if (!$data) {
            return response()->json([
                'success' => false,
                'error' => "Day care center not found: {$id}",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * GET /api/workers
     */
    public function getWorkers(Request $request): JsonResponse
    {
        $filters = [
            'role' => $request->query('role', 'all'),
            'search' => $request->query('search', ''),
        ];

        $data = $this->communityService->getWorkers($filters);

        return response()->json([
            'success' => true,
            'message' => 'Workers retrieved successfully.',
            'data' => $data,
        ]);
    }

    /**
     * GET /api/workers/{id}
     */
    public function getWorkerById(string $id): JsonResponse
    {
        $data = $this->communityService->getWorkerById($id);

        if (!$data) {
            return response()->json([
                'success' => false,
                'error' => "Worker not found: {$id}",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
