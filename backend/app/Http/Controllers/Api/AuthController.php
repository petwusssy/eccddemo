<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     * Authenticate user credentials and return JWT bearer token.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok' => false,
                'status' => 422,
                'error' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $credentials = [
            'email' => strtolower(trim((string)$request->input('email'))),
            'password' => (string)$request->input('password'),
        ];

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json([
                'ok' => false,
                'status' => 401,
                'error' => 'Invalid email or password credentials.',
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = auth('api')->user();
        if ($user) {
            $user->load(['role', 'worker.dayCareCenter', 'worker.barangay']);
        }

        return response()->json([
            'ok' => true,
            'status' => 200,
            'message' => 'Authentication successful.',
            'data' => [
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role ? [
                        'id' => $user->role->id,
                        'name' => $user->role->name,
                        'label' => $user->role->label,
                        'permissions' => $user->role->permissions,
                    ] : null,
                    'worker' => $user->worker ? [
                        'id' => $user->worker->id,
                        'name' => $user->worker->name,
                        'role' => $user->worker->role,
                        'barangay_id' => $user->worker->barangay_id,
                        'day_care_center_id' => $user->worker->day_care_center_id,
                        'barangay' => $user->worker->barangay ? ['id' => $user->worker->barangay->id, 'name' => $user->worker->barangay->name] : null,
                        'dayCareCenter' => $user->worker->dayCareCenter ? ['id' => $user->worker->dayCareCenter->id, 'name' => $user->worker->dayCareCenter->name] : null,
                    ] : null,
                ],
            ],
        ]);
    }

    /**
     * GET /api/auth/me
     * Get authenticated user profile via JWT.
     */
    public function me(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = auth('api')->user();

        if (!$user) {
            return response()->json([
                'ok' => false,
                'status' => 401,
                'error' => 'Unauthenticated or expired token.',
            ], 401);
        }

        $user->load(['role', 'worker']);

        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role ? [
                        'id' => $user->role->id,
                        'name' => $user->role->name,
                        'label' => $user->role->label,
                        'permissions' => $user->role->permissions,
                    ] : null,
                    'worker' => $user->worker,
                ],
            ],
        ]);
    }

    /**
     * POST /api/auth/logout
     * Invalidate current JWT token.
     */
    public function logout(): JsonResponse
    {
        try {
            auth('api')->logout();
        } catch (\Throwable $e) {
            // Already logged out or invalid token
        }

        return response()->json([
            'ok' => true,
            'status' => 200,
            'message' => 'Successfully logged out.',
        ]);
    }

    /**
     * POST /api/auth/refresh
     * Refresh an existing JWT token.
     */
    public function refresh(): JsonResponse
    {
        try {
            $newToken = auth('api')->refresh();

            return response()->json([
                'ok' => true,
                'status' => 200,
                'data' => [
                    'access_token' => $newToken,
                    'token_type' => 'bearer',
                    'expires_in' => auth('api')->factory()->getTTL() * 60,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'status' => 401,
                'error' => 'Could not refresh token: ' . $e->getMessage(),
            ], 401);
        }
    }
}
