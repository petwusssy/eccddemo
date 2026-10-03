<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ChildManagementService;
use App\Services\DevelopmentAssessmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DevelopmentAssessmentController extends Controller
{
    protected DevelopmentAssessmentService $devService;
    protected ChildManagementService $childService;

    public function __construct(DevelopmentAssessmentService $devService, ChildManagementService $childService)
    {
        $this->devService = $devService;
        $this->childService = $childService;
    }

    /**
     * GET /api/development/assessments
     * Returns development assessments list with status filters and summary counts.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'status' => $request->query('status', 'all'),
            'barangay' => $request->query('barangay', 'all'),
            'dayCareCenter' => $request->query('dayCareCenter', 'all'),
            'search' => $request->query('search', ''),
        ];

        $data = $this->devService->getAssessments($filters);

        return response()->json([
            'success' => true,
            'message' => 'Development assessments retrieved successfully.',
            'data' => $data,
        ]);
    }

    /**
     * GET /api/children/{id}/development
     * Returns chronological assessment history and integration point placeholders.
     */
    public function getChildDevelopment(string $id): JsonResponse
    {
        $data = $this->devService->getChildDevelopment($id);

        if (!$data) {
            return response()->json([
                'success' => false,
                'error' => "Development assessment records not found for child ID: {$id}",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * POST /api/children/{id}/development
     * Records new assessment metadata session and updates Child 360° Profile & follow-up queue.
     */
    public function recordAssessment(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'assessmentDate' => 'required|date',
            'assessor' => 'required|string|max:150',
            'status' => 'required|in:Assessment Pending,Assessment Completed,Follow-up Required',
            'notes' => 'nullable|string|max:1000',
            'assessmentCycle' => 'nullable|string|max:100',
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

        $result = $this->devService->recordAssessment($id, $validator->validated(), $this->childService);

        return response()->json([
            'success' => true,
            'message' => 'Development assessment logged successfully. Child 360° Profile updated.',
            'data' => $result,
        ], 201);
    }

    /**
     * GET /api/development/reference
     * Returns official ECCD checklist framework integration specification and placeholders.
     */
    public function reference(): JsonResponse
    {
        $data = $this->devService->getReference();

        return response()->json([
            'success' => true,
            'message' => 'Official ECCD Checklist integration reference retrieved.',
            'data' => $data,
        ]);
    }
}
