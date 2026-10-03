<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ResourceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    protected ResourceService $resourceService;

    public function __construct(ResourceService $resourceService)
    {
        $this->resourceService = $resourceService;
    }

    /**
     * GET /api/resources
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'section' => $request->query('section', 'all'),
            'search' => $request->query('search', ''),
        ];

        $data = $this->resourceService->getResources($filters);

        return response()->json([
            'success' => true,
            'message' => 'ECCD official forms and resources retrieved.',
            'data' => $data,
        ]);
    }

    /**
     * GET /api/resources/{id}
     */
    public function show(string $id): JsonResponse
    {
        $data = $this->resourceService->getResourceById($id);

        if (!$data) {
            return response()->json([
                'success' => false,
                'error' => "Resource not found: {$id}",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
