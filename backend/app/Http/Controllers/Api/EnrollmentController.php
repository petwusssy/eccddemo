<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EnrollmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function __construct(
        protected EnrollmentService $enrollmentService
    ) {}

    /**
     * GET /api/enrollments
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'barangay', 'center', 'schoolYear']);
        $data = $this->enrollmentService->getEnrollments($filters);
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $data,
        ]);
    }

    /**
     * GET /api/enrollments/not-enrolled
     */
    public function notEnrolled(Request $request): JsonResponse
    {
        $filters = $request->only(['barangay', 'age', 'year', 'status']);
        $data = $this->enrollmentService->getNotEnrolledChildren($filters);
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $data,
        ]);
    }

    /**
     * POST /api/enrollments
     */
    public function store(Request $request): JsonResponse
    {
        $result = $this->enrollmentService->enrollChild($request->all());
        return response()->json([
            'ok' => true,
            'status' => 201,
            'data' => $result,
        ], 201);
    }

    /**
     * GET /api/children/{id}/enrollment
     */
    public function childEnrollment(string $id): JsonResponse
    {
        $data = $this->enrollmentService->getChildEnrollment($id);
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $data,
        ]);
    }

    /**
     * PUT /api/enrollments/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $updated = $this->enrollmentService->updateEnrollment($id, $request->all());
        if (!$updated) {
            return response()->json([
                'ok' => false,
                'status' => 404,
                'error' => ['message' => 'Enrollment record not found'],
            ], 404);
        }
        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $updated,
        ]);
    }
}
