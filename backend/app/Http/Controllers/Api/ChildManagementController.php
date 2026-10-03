<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ChildManagementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChildManagementController extends Controller
{
    public function __construct(
        protected ChildManagementService $childService
    ) {}

    /**
     * GET /api/children
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'barangay', 'enrollmentStatus', 'sex']);
        $data = $this->childService->getChildren($filters);
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $data,
        ]);
    }

    /**
     * GET /api/children/{id}
     */
    public function show(string $id): JsonResponse
    {
        $child = $this->childService->getChildById($id);
        if (!$child) {
            return response()->json([
                'ok' => false,
                'status' => 404,
                'error' => ['message' => 'Child record not found'],
            ], 404);
        }
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $child,
        ]);
    }

    /**
     * GET /api/children/{id}/timeline
     */
    public function timeline(string $id): JsonResponse
    {
        $timeline = $this->childService->getTimeline($id);
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $timeline,
        ]);
    }

    /**
     * GET /api/children/{id}/household
     */
    public function household(string $id): JsonResponse
    {
        $household = $this->childService->getHousehold($id);
        if (!$household) {
            return response()->json([
                'ok' => false,
                'status' => 404,
                'error' => ['message' => 'Household for child not found'],
            ], 404);
        }
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $household,
        ]);
    }

    /**
     * GET /api/children/{id}/status
     */
    public function status(string $id): JsonResponse
    {
        $status = $this->childService->getStatusPillars($id);
        if (!$status) {
            return response()->json([
                'ok' => false,
                'status' => 404,
                'error' => ['message' => 'Status pillars not found'],
            ], 404);
        }
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $status,
        ]);
    }

    /**
     * POST /api/children
     */
    public function store(Request $request): JsonResponse
    {
        $child = $this->childService->createChild($request->all());
        return response()->json([
            'ok' => true,
            'status' => 201,
            'data' => $child,
        ], 201);
    }

    /**
     * PUT /api/children/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $child = $this->childService->updateChild($id, $request->all());
        if (!$child) {
            return response()->json([
                'ok' => false,
                'status' => 404,
                'error' => ['message' => 'Child record not found to update'],
            ], 404);
        }
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $child,
        ]);
    }
}
