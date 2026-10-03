<?php

namespace App\Services;

class AuditLogService
{
    /**
     * Centralized audit log dataset for prototype system governance.
     * Columns: Date/Time, User, Role, Action, Module, Record, Status
     * Do not claim compliance certifications. Prototype security and governance controls.
     */
    protected static array $logs = [];

    /**
     * GET /api/audit-logs
     */
    public function getLogs(array $filters = []): array
    {
        $all = self::$logs;

        if (!empty($filters['role']) && $filters['role'] !== 'all') {
            $all = array_filter($all, fn($l) => $l['role'] === $filters['role']);
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $all = array_filter($all, fn($l) => $l['status'] === $filters['status']);
        }

        if (!empty($filters['module']) && $filters['module'] !== 'all') {
            $all = array_filter($all, fn($l) => $l['module'] === $filters['module']);
        }

        if (!empty($filters['search'])) {
            $q = strtolower(trim($filters['search']));
            $all = array_filter($all, function ($l) use ($q) {
                return str_contains(strtolower($l['user']), $q)
                    || str_contains(strtolower($l['action']), $q)
                    || str_contains(strtolower($l['record']), $q)
                    || str_contains(strtolower($l['details']), $q);
            });
        }

        return [
            'total' => count($all),
            'logs' => array_values($all),
            'summary' => [
                'totalLoggedActions' => count(self::$logs),
                'successfulActions' => count(array_filter(self::$logs, fn($l) => $l['status'] === 'Successful')),
                'unauthorizedAttempts' => count(array_filter(self::$logs, fn($l) => in_array($l['status'], ['Unauthorized Attempt', 'Access Restricted']))),
            ],
            'governanceNotice' => 'Prototype system audit trail. Captures operational actions without altering authoritative master records.',
        ];
    }

    /**
     * POST /api/audit-logs
     */
    public function recordLog(array $data): array
    {
        $id = 'LOG-2026-' . str_pad((string) (count(self::$logs) + 902), 4, '0', STR_PAD_LEFT);

        $newEntry = [
            'id' => $id,
            'timestamp' => now()->format('Y-m-d H:i:s'),
            'user' => $data['user'] ?? 'Authorized User',
            'role' => $data['role'] ?? 'Staff',
            'action' => $data['action'] ?? 'System Event',
            'module' => $data['module'] ?? 'System',
            'record' => $data['record'] ?? 'N/A',
            'status' => $data['status'] ?? 'Successful',
            'ipAddress' => request()->ip() ?? '127.0.0.1',
            'details' => $data['details'] ?? 'System governance automated activity log entry.',
        ];

        array_unshift(self::$logs, $newEntry);

        return [
            'success' => true,
            'log' => $newEntry,
        ];
    }

    /**
     * Role Permissions Matrix
     */
    public function getRolePermissions(): array
    {
        return [
            'roles' => [
                [
                    'id' => 'cswdo_admin',
                    'name' => 'CSWDO Admin / Supervisor',
                    'description' => 'Full administrative access across all 35 barangays, central reports, audit trail, and user management.',
                    'scope' => 'Organization-wide (All Centers & Barangays)',
                    'allowedModules' => ['*'],
                    'restrictions' => [],
                ],
                [
                    'id' => 'field_worker',
                    'name' => 'Service Provider / Field Worker',
                    'description' => 'Conducts community mapping, household demographic surveys, and initial child registration in assigned puroks.',
                    'scope' => 'Assigned Barangays / Puroks',
                    'allowedModules' => ['dashboard', 'children', 'households', 'community-mapping', 'enrollment', 'follow-ups', 'barangays', 'daycare-centers', 'workers'],
                    'restrictions' => [
                        'Cannot access system administration or settings.',
                        'Cannot access or modify security audit logs.',
                        'Cannot delete persistent child demographic records.',
                    ],
                ],
                [
                    'id' => 'daycare_worker',
                    'name' => 'Day Care Worker / Child Development Worker',
                    'description' => 'Manages classroom attendance, monthly height/weight monitoring, and ECCD checklist assessments for assigned center.',
                    'scope' => 'Assigned Day Care Center & Cohort Only',
                    'allowedModules' => ['dashboard', 'children', 'enrollment', 'health-monitoring', 'eccd-checklist', 'follow-ups', 'daycare-centers', 'reports'],
                    'restrictions' => [
                        'Can only access assigned center and assigned children cohort.',
                        'Cannot access system administration, settings, or audit logs.',
                        'Cannot access city-wide executive consolidated reports.',
                    ],
                ],
            ],
            'governanceRules' => [
                'Least Privilege Principle applied to all user roles.',
                'Explicit route protection with 403 Forbidden interceptor.',
                'Mandatory audit logging on sensitive demographic views and modifications.',
            ],
        ];
    }
}
