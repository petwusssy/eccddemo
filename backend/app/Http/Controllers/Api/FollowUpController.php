<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ChildManagementService;
use App\Services\FollowUpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FollowUpController extends Controller
{
    protected FollowUpService $followUpService;
    protected ChildManagementService $childService;

    public function __construct(FollowUpService $followUpService, ChildManagementService $childService)
    {
        $this->followUpService = $followUpService;
        $this->childService = $childService;
    }

    /**
     * GET /api/follow-ups
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'category' => $request->query('category', 'all'),
            'actionType' => $request->query('actionType', 'all'),
            'barangay' => $request->query('barangay', 'all'),
            'assignedWorker' => $request->query('assignedWorker', 'all'),
            'search' => $request->query('search', ''),
        ];

        $data = $this->followUpService->getFollowUps($filters);

        return response()->json([
            'success' => true,
            'message' => 'Follow-up queue retrieved successfully.',
            'data' => $data,
        ]);
    }

    /**
     * GET /api/follow-ups/needs-attention
     */
    public function needsAttention(): JsonResponse
    {
        $data = $this->followUpService->getNeedsAttention();

        return response()->json([
            'success' => true,
            'message' => 'Needs Attention queue retrieved successfully.',
            'data' => $data,
        ]);
    }

    /**
     * POST /api/follow-ups
     * Allows CSWDO authorized users to assign a follow-up to a worker.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'childId' => 'required|string|max:50',
            'childName' => 'nullable|string|max:150',
            'barangay' => 'nullable|string|max:100',
            'dayCareCenter' => 'nullable|string|max:150',
            'reason' => 'required|string|max:1000',
            'assignedWorker' => 'required|string|max:150',
            'workerContact' => 'nullable|string|max:50',
            'createdDate' => 'nullable|date',
            'dueDate' => 'required|date',
            'category' => 'nullable|in:Needs Attention,Pending,Scheduled,Completed',
            'actionType' => 'required|in:Follow-up,Family Contact,Scheduled Visit,Referral,Monitoring,Other',
            'notes' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors(),
            ], 422);
        }

        $case = $this->followUpService->createFollowUp($validator->validated(), $this->childService);

        return response()->json([
            'success' => true,
            'message' => 'Follow-up case created and assigned successfully.',
            'data' => $case,
        ], 201);
    }

    /**
     * PUT /api/follow-ups/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'sometimes|string|max:1000',
            'assignedWorker' => 'sometimes|string|max:150',
            'dueDate' => 'sometimes|date',
            'category' => 'sometimes|in:Needs Attention,Pending,Scheduled,Completed',
            'status' => 'sometimes|in:Needs Attention,Pending,Scheduled,Completed',
            'actionType' => 'sometimes|in:Follow-up,Family Contact,Scheduled Visit,Referral,Monitoring,Other',
            'notes' => 'nullable|string|max:2000',
            'actionTaken' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors(),
            ], 422);
        }

        $case = $this->followUpService->updateFollowUp($id, $validator->validated());

        if (!$case) {
            return response()->json([
                'success' => false,
                'error' => "Follow-up case not found: {$id}",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Follow-up case updated successfully.',
            'data' => $case,
        ]);
    }

    /**
     * POST /api/follow-ups/{id}/resolve
     * Resolves follow-up, logs action taken, notes, date, and marks status as Completed.
     */
    public function resolve(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date' => 'nullable|date',
            'resolvedDate' => 'nullable|date',
            'actionTaken' => 'required|string|max:2000',
            'notes' => 'nullable|string|max:2000',
            'status' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors(),
            ], 422);
        }

        $resolvedCase = $this->followUpService->resolveFollowUp($id, $validator->validated(), $this->childService);

        if (!$resolvedCase) {
            return response()->json([
                'success' => false,
                'error' => "Follow-up case not found: {$id}",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Follow-up case resolved and logged to child timeline.',
            'data' => $resolvedCase,
        ]);
    }

    /**
     * GET /api/follow-ups/{id}/case-view
     */
    public function caseView(string $id): JsonResponse
    {
        $view = $this->followUpService->getCaseView($id, $this->childService);

        if (!$view) {
            return response()->json([
                'success' => false,
                'error' => "Case view not found for ID: {$id}",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $view,
        ]);
    }
}
