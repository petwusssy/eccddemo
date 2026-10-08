<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    /**
     * List all users with roles, worker assignments, and centers.
     */
    public function index(Request $request)
    {
        $users = User::with(['role', 'worker.dayCareCenter', 'worker.barangay'])
            ->orderBy('id', 'asc')
            ->get();

        $formatted = $users->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role_id' => $u->role_id,
                'role' => $u->role ? [
                    'id' => $u->role->id,
                    'name' => $u->role->name,
                    'label' => $u->role->label,
                    'permissions' => $u->role->permissions,
                ] : null,
                'worker' => $u->worker ? [
                    'id' => $u->worker->id,
                    'name' => $u->worker->name,
                    'role' => $u->worker->role,
                    'contact' => $u->worker->contact,
                    'status' => $u->worker->status,
                    'dayCareCenter' => $u->worker->dayCareCenter ? [
                        'id' => $u->worker->dayCareCenter->id,
                        'name' => $u->worker->dayCareCenter->name,
                    ] : null,
                    'barangay' => $u->worker->barangay ? [
                        'id' => $u->worker->barangay->id,
                        'name' => $u->worker->barangay->name,
                    ] : null,
                ] : null,
                'created_at' => $u->created_at?->toIso8601String(),
                'updated_at' => $u->updated_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $formatted,
        ]);
    }

    /**
     * Get list of assignable roles.
     */
    public function roles()
    {
        $roles = Role::whereIn('name', ['sysadmin', 'eccd_admin', 'cdt'])
            ->orderByRaw("CASE 
                WHEN name = 'sysadmin' THEN 1 
                WHEN name = 'eccd_admin' THEN 2 
                WHEN name = 'cdt' THEN 3 
                ELSE 4 END")
            ->get();

        if ($roles->isEmpty()) {
            $roles = Role::orderBy('id', 'asc')->get();
        }

        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $roles,
        ]);
    }

    /**
     * Create a new user account with initial credentials and optional worker profile.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id',
            'day_care_center_id' => 'nullable|exists:day_care_centers,id',
            'barangay_id' => 'nullable|exists:barangays,id',
            'contact' => 'nullable|string|max:50',
        ]);

        $user = User::create([
            'name' => trim($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
        ]);

        $role = Role::find($validated['role_id']);

        // If CDT or Daycare Worker or assignment specified, create or link a Worker record
        if (
            !empty($validated['day_care_center_id']) ||
            !empty($validated['barangay_id']) ||
            in_array($role?->name, ['cdt', 'daycare_worker', 'field_worker'])
        ) {
            Worker::create([
                'user_id' => $user->id,
                'role_id' => $user->role_id,
                'name' => $user->name,
                'role' => $role?->label ?? 'Child Development Teacher (CDT)',
                'day_care_center_id' => $validated['day_care_center_id'] ?? null,
                'barangay_id' => $validated['barangay_id'] ?? null,
                'contact' => $validated['contact'] ?? null,
                'status' => 'Active',
            ]);
        }

        // Record Audit Log
        try {
            AuditLog::create([
                'user_id' => auth()->id() ?? $user->id,
                'action' => 'User Account Created',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'details' => json_encode([
                    'created_user_id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $role?->name,
                ]),
            ]);
        } catch (\Throwable $e) {
            // Silently allow logging fallback
        }

        $user->load(['role', 'worker.dayCareCenter', 'worker.barangay']);

        return response()->json([
            'ok' => true,
            'status' => 201,
            'message' => 'User account created successfully.',
            'data' => $user,
        ], 201);
    }

    /**
     * Get a specific user details.
     */
    public function show($id)
    {
        $user = User::with(['role', 'worker.dayCareCenter', 'worker.barangay'])->find($id);

        if (!$user) {
            return response()->json([
                'ok' => false,
                'status' => 404,
                'error' => 'User not found.',
            ], 404);
        }

        return response()->json([
            'ok' => true,
            'status' => 200,
            'data' => $user,
        ]);
    }

    /**
     * Update user details and role.
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'ok' => false,
                'status' => 404,
                'error' => 'User not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'role_id' => 'required|exists:roles,id',
            'day_care_center_id' => 'nullable|exists:day_care_centers,id',
            'barangay_id' => 'nullable|exists:barangays,id',
            'contact' => 'nullable|string|max:50',
            'password' => 'nullable|string|min:6',
        ]);

        $user->name = trim($validated['name']);
        $user->email = strtolower(trim($validated['email']));
        $user->role_id = $validated['role_id'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        // Update or create associated worker
        $worker = Worker::where('user_id', $user->id)->first();
        $role = Role::find($validated['role_id']);

        if ($worker) {
            $worker->name = $user->name;
            $worker->role_id = $user->role_id;
            $worker->role = $role?->label ?? $worker->role;
            $worker->day_care_center_id = $validated['day_care_center_id'] ?? $worker->day_care_center_id;
            $worker->barangay_id = $validated['barangay_id'] ?? $worker->barangay_id;
            if (isset($validated['contact'])) {
                $worker->contact = $validated['contact'];
            }
            $worker->save();
        } elseif (
            !empty($validated['day_care_center_id']) ||
            !empty($validated['barangay_id']) ||
            in_array($role?->name, ['cdt', 'daycare_worker', 'field_worker'])
        ) {
            Worker::create([
                'user_id' => $user->id,
                'role_id' => $user->role_id,
                'name' => $user->name,
                'role' => $role?->label ?? 'Child Development Teacher (CDT)',
                'day_care_center_id' => $validated['day_care_center_id'] ?? null,
                'barangay_id' => $validated['barangay_id'] ?? null,
                'contact' => $validated['contact'] ?? null,
                'status' => 'Active',
            ]);
        }

        // Record Audit Log
        try {
            AuditLog::create([
                'user_id' => auth()->id() ?? $user->id,
                'action' => 'User Account Updated',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'details' => json_encode([
                    'updated_user_id' => $user->id,
                    'email' => $user->email,
                    'role_id' => $user->role_id,
                ]),
            ]);
        } catch (\Throwable $e) {}

        $user->load(['role', 'worker.dayCareCenter', 'worker.barangay']);

        return response()->json([
            'ok' => true,
            'status' => 200,
            'message' => 'User account updated successfully.',
            'data' => $user,
        ]);
    }

    /**
     * Reset user password by IT Admin.
     */
    public function resetPassword(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'ok' => false,
                'status' => 404,
                'error' => 'User not found.',
            ], 404);
        }

        $password = $request->input('password') ?? $request->json('password') ?? $request->get('password');
        if (empty($password) || strlen($password) < 6) {
            return response()->json([
                'ok' => false,
                'status' => 422,
                'error' => 'Password must be at least 6 characters.',
            ], 422);
        }

        $user->password = Hash::make($password);
        $user->save();

        try {
            AuditLog::create([
                'user_id' => auth()->id() ?? $user->id,
                'action' => 'Password Reset by Administrator',
                'entity_type' => 'User',
                'entity_id' => $user->id,
                'details' => json_encode([
                    'target_user' => $user->email,
                ]),
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'ok' => true,
            'status' => 200,
            'message' => "Password for {$user->name} has been reset successfully.",
        ]);
    }

    /**
     * Delete user account.
     */
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'ok' => false,
                'status' => 404,
                'error' => 'User not found.',
            ], 404);
        }

        // Prevent deleting own account
        if (auth()->check() && auth()->id() == $id) {
            return response()->json([
                'ok' => false,
                'status' => 403,
                'error' => 'You cannot delete your own active administrator account.',
            ], 403);
        }

        // Prevent deleting the primary admin account or sysadmin account
        if ($user->id === 1 || $user->email === 'sysadmin@csfp.gov.ph' || $user->role?->name === 'sysadmin') {
            return response()->json([
                'ok' => false,
                'status' => 403,
                'error' => 'The CSFP System Administrator account cannot be deleted.',
            ], 403);
        }

        $userName = $user->name;
        $userEmail = $user->email;

        // Unlink or delete associated worker profile
        Worker::where('user_id', $user->id)->update(['user_id' => null]);
        $user->delete();

        try {
            AuditLog::create([
                'user_id' => auth()->id() ?? 1,
                'action' => 'User Account Deleted',
                'entity_type' => 'User',
                'entity_id' => (int) $id,
                'details' => json_encode([
                    'deleted_name' => $userName,
                    'deleted_email' => $userEmail,
                ]),
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'ok' => true,
            'status' => 200,
            'message' => "User account {$userName} ({$userEmail}) was deleted successfully.",
        ]);
    }
}
