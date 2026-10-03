<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    protected AuditLogService $auditService;

    public function __construct(AuditLogService $auditService)
    {
        $this->auditService = $auditService;
    }

    /**
     * GET /api/audit-logs
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'role' => $request->query('role', 'all'),
            'status' => $request->query('status', 'all'),
            'module' => $request->query('module', 'all'),
            'search' => $request->query('search', ''),
        ];

        $data = $this->auditService->getLogs($filters);

        return response()->json([
            'success' => true,
            'message' => 'Audit logs retrieved successfully.',
            'data' => $data,
        ]);
    }

    /**
     * POST /api/audit-logs
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user' => 'required|string',
            'role' => 'required|string',
            'action' => 'required|string',
            'module' => 'required|string',
            'record' => 'nullable|string',
            'status' => 'nullable|string',
            'details' => 'nullable|string',
        ]);

        $res = $this->auditService->recordLog($validated);

        return response()->json($res, 201);
    }

    /**
     * GET /api/governance/roles
     */
    public function roles(): JsonResponse
    {
        $data = $this->auditService->getRolePermissions();
        return response()->json(['success' => true, 'data' => $data]);
    }
}
