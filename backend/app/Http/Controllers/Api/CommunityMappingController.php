<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CommunityMappingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityMappingController extends Controller
{
    public function __construct(
        protected CommunityMappingService $mappingService
    ) {}

    /**
     * GET /api/mapping/activities
     */
    public function getActivities(): JsonResponse
    {
        $data = $this->mappingService->getActivities();
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $data,
        ]);
    }

    /**
     * POST /api/mapping/activities
     */
    public function createActivity(Request $request): JsonResponse
    {
        $activity = $this->mappingService->createActivity($request->all());
        return response()->json([
            'ok' => true,
            'status' => 201,
            'data' => $activity,
        ], 201);
    }

    /**
     * GET /api/mapping/activities/{id}
     */
    public function getActivityById(string $id): JsonResponse
    {
        $activity = $this->mappingService->getActivityById($id);
        if (!$activity) {
            return response()->json([
                'ok' => false,
                'status' => 404,
                'error' => ['message' => 'Mapping activity not found'],
            ], 404);
        }
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $activity,
        ]);
    }

    /**
     * POST /api/mapping/activities/{id}/assignments
     */
    public function assignWorkers(Request $request, string $id): JsonResponse
    {
        $workers = $request->input('workers', []);
        $barangay = $request->input('barangay', 'San Isidro');
        $res = $this->mappingService->assignWorkers($id, $workers, $barangay);
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $res,
        ]);
    }

    /**
     * GET /api/households
     */
    public function getHouseholds(): JsonResponse
    {
        $households = $this->mappingService->getHouseholds();
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $households,
        ]);
    }

    /**
     * POST /api/households
     */
    public function createHousehold(Request $request): JsonResponse
    {
        $household = $this->mappingService->createHousehold($request->all());
        return response()->json([
            'ok' => true,
            'status' => 201,
            'data' => $household,
        ], 201);
    }

    /**
     * GET /api/households/{id}
     */
    public function getHouseholdById(string $id): JsonResponse
    {
        $hh = $this->mappingService->getHouseholdById($id);
        if (!$hh) {
            return response()->json([
                'ok' => false,
                'status' => 404,
                'error' => ['message' => 'Household record not found'],
            ], 404);
        }
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $hh,
        ]);
    }

    /**
     * GET /api/children/search
     */
    public function searchChildren(Request $request): JsonResponse
    {
        $query = $request->input('q', '');
        $birthDate = $request->input('birthDate');
        $matches = $this->mappingService->searchChildren($query, $birthDate);
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $matches,
        ]);
    }

    /**
     * POST /api/children or POST /api/mapping/children
     */
    public function createChild(Request $request): JsonResponse
    {
        $result = $this->mappingService->createChild($request->all());
        return response()->json([
            'ok' => true,
            'status' => 201,
            'data' => $result,
        ], 201);
    }

    /**
     * POST /api/mapping/sync
     * Batch synchronization of offline surveys, households, and children.
     */
    public function syncBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'surveys' => 'nullable|array',
            'households' => 'nullable|array',
            'children' => 'nullable|array',
            'frontlineActions' => 'nullable|array',
        ]);

        $result = $this->mappingService->syncBatch($validated);

        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $result,
            'message' => $result['message'] ?? 'Records synchronized successfully.',
        ], 200);
    }
}

