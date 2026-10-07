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
                    'id' => 'eccd_admin',
                    'name' => 'ECCD Administrative',
                    'description' => 'Responsible for consolidating data, coordinating requirements, planning and organizing programs and services.',
                    'scope' => 'City-wide Consolidation & Planning Scope',
                    'allowedModules' => ['*'],
                    'restrictions' => [],
                ],
                [
                    'id' => 'cdt',
                    'name' => 'Child Development Teacher (CDT)',
                    'description' => 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
                    'scope' => 'Frontline Implementation (Assigned Centers & Communities)',
                    'allowedModules' => [
                        'children',
                        'households',
                        'community-mapping',
                        'enrollment',
                        'health-monitoring',
                        'eccd-checklist',
                        'development-assessment',
                        'follow-ups',
                        'community-network',
                    ],
                    'restrictions' => [
                        'Cannot access consolidated executive dashboard or citywide KPI cards.',
                        'Cannot access citywide consolidated Form 5 submissions and planning reports.',
                        'Cannot access system administration, settings, or user management.',
                        'Cannot access or modify security audit logs.',
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
