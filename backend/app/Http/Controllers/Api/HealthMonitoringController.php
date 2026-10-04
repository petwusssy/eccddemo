<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ChildManagementService;
use App\Services\HealthMonitoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HealthMonitoringController extends Controller
{
    protected HealthMonitoringService $healthService;
    protected ChildManagementService $childService;

    public function __construct(HealthMonitoringService $healthService, ChildManagementService $childService)
    {
        $this->healthService = $healthService;
        $this->childService = $childService;
    }

    /**
     * GET /api/health-monitoring/due
     * Returns children due/overdue for monthly height and weight checks, with summary cards.
     */
    public function due(Request $request): JsonResponse
    {
        $filters = [
            'status' => $request->query('status', 'all'),
            'barangay' => $request->query('barangay', 'all'),
            'dayCareCenter' => $request->query('dayCareCenter', 'all'),
            'search' => $request->query('search', ''),
        ];

        $data = $this->healthService->getDueMonitoring($filters);

        return response()->json([
            'success' => true,
            'message' => 'Health monitoring due list retrieved successfully.',
            'data' => $data,
        ]);
    }

    /**
     * GET /api/children/{id}/health
     * Returns child health history, current monitoring status, and trend data.
     */
    public function getChildHealth(string $id): JsonResponse
    {
        $data = $this->healthService->getChildHealth($id);

        if (!$data) {
            return response()->json([
                'success' => false,
                'error' => "Health records not found for child ID: {$id}",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * POST /api/children/{id}/health
     * Records monthly height and weight measurement.
     * Integrates with Child 360° Profile: updates health status and timeline.
     */
    public function recordChildHealth(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'height' => 'nullable|numeric|min:30|max:150',
            'heightCm' => 'nullable|numeric|min:30|max:150',
            'weight' => 'nullable|numeric|min:2|max:60',
            'weightKg' => 'nullable|numeric|min:2|max:60',
            'nutritionalStatus' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:1000',
            'recordedBy' => 'nullable|string|max:150',
            'childName' => 'nullable|string|max:150',
            'barangay' => 'nullable|string|max:100',
            'dayCareCenter' => 'nullable|string|max:150',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors(),
            ], 422);
        }

        $input = $validator->validated();

        // Ensure at least one height and weight value is provided
        $height = $input['height'] ?? $input['heightCm'] ?? null;
        $weight = $input['weight'] ?? $input['weightKg'] ?? null;

        if ($height === null || $weight === null) {
            return response()->json([
                'success' => false,
                'error' => 'Both height (cm) and weight (kg) are required.',
            ], 422);
        }

        $result = $this->healthService->recordChildHealth($id, $input, $this->childService);

        return response()->json([
            'success' => true,
            'message' => 'Monthly health monitoring record created successfully. Child 360° Profile updated.',
            'data' => $result,
        ], 201);
    }

    /**
     * PUT /api/health-monitoring/{id}
     * Updates an existing health measurement record.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date' => 'sometimes|date',
            'height' => 'sometimes|numeric|min:30|max:150',
            'heightCm' => 'sometimes|numeric|min:30|max:150',
            'weight' => 'sometimes|numeric|min:2|max:60',
            'weightKg' => 'sometimes|numeric|min:2|max:60',
            'notes' => 'nullable|string|max:1000',
            'recordedBy' => 'sometimes|string|max:150',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors(),
            ], 422);
        }

        $record = $this->healthService->updateHealthRecord($id, $validator->validated());

        if (!$record) {
            return response()->json([
                'success' => false,
                'error' => "Health record not found: {$id}",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Health monitoring record updated successfully.',
            'data' => $record,
        ]);
    }
}
