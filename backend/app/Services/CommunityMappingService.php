<?php

namespace App\Services;

class CommunityMappingService
{
    /**
     * In-memory persistent demo store for activities, households, and children.
     */
    protected static array $activities = [
        [
            'id' => 'ACT-MAP-2026-001',
            'name' => '2026 Annual CSWDO House-to-House Child Mapping Drive',
            'year' => 2026,
            'barangays' => ['San Isidro', 'Calulut', 'Dolores', 'San Jose', 'Juliana'],
            'startDate' => '2026-09-01',
            'endDate' => '2026-11-30',
            'assignedWorkers' => [
                ['id' => 'USR-FW-009', 'name' => 'Rodel Mendoza', 'role' => 'Community Development Officer II'],
                ['id' => 'USR-FW-010', 'name' => 'Maria Santos', 'role' => 'Child Development Worker I'],
                ['id' => 'USR-FW-011', 'name' => 'Lourdes David', 'role' => 'Child Development Worker II'],
            ],
            'status' => 'In Progress',
            'progress' => 0,
            'totalTargetHouseholds' => 450,
            'mappedHouseholds' => 0,
            'childrenIdentified' => 0,
            'archived' => false,
        ],
        [
            'id' => 'ACT-MAP-2026-002',
            'name' => 'Sitio Riverside & High-Density Purok Vulnerability Survey',
            'year' => 2026,
            'barangays' => ['Dela Paz Sur', 'Lourdes'],
            'startDate' => '2026-10-01',
            'endDate' => '2026-12-15',
            'assignedWorkers' => [
                ['id' => 'USR-FW-012', 'name' => 'Grace Pineda', 'role' => 'Child Development Worker II'],
            ],
            'status' => 'Pending Start',
            'progress' => 0,
            'totalTargetHouseholds' => 180,
            'mappedHouseholds' => 0,
            'childrenIdentified' => 0,
            'archived' => false,
        ],
        [
            'id' => 'ACT-MAP-2025-004',
            'name' => '2025 Year-End Mid-Term Demographic Assessment',
            'year' => 2025,
            'barangays' => ['Sindalan', 'Magliman', 'Santa Lucia'],
            'startDate' => '2025-09-01',
            'endDate' => '2025-11-30',
            'assignedWorkers' => [
                ['id' => 'USR-FW-009', 'name' => 'Rodel Mendoza', 'role' => 'Community Development Officer II'],
            ],
            'status' => 'Completed',
            'progress' => 0,
            'totalTargetHouseholds' => 320,
            'mappedHouseholds' => 0,
            'childrenIdentified' => 0,
            'archived' => true,
        ],
    ];

    protected static array $assignments = [
        [
            'workerId' => 'USR-FW-009',
            'workerName' => 'Rodel Mendoza',
            'assignedBarangay' => 'Dolores',
            'activityId' => 'ACT-MAP-2026-001',
            'activityName' => '2026 Annual CSWDO House-to-House Child Mapping Drive',
            'progress' => 0,
            'householdsMapped' => 0,
            'childrenIdentified' => 0,
            'remainingHouseholds' => 38,
            'status' => 'Active in Field',
        ],
        [
            'workerId' => 'USR-FW-010',
            'workerName' => 'Maria Santos',
            'assignedBarangay' => 'San Isidro',
            'activityId' => 'ACT-MAP-2026-001',
            'activityName' => '2026 Annual CSWDO House-to-House Child Mapping Drive',
            'progress' => 0,
            'householdsMapped' => 0,
            'childrenIdentified' => 0,
            'remainingHouseholds' => 60,
            'status' => 'Active in Field',
        ],
        [
            'workerId' => 'USR-FW-011',
            'workerName' => 'Lourdes David',
            'assignedBarangay' => 'Calulut',
            'activityId' => 'ACT-MAP-2026-001',
            'activityName' => '2026 Annual CSWDO House-to-House Child Mapping Drive',
            'progress' => 0,
            'householdsMapped' => 0,
            'childrenIdentified' => 0,
            'remainingHouseholds' => 52,
            'status' => 'Active in Field',
        ],
    ];

    protected static array $households = [];

    protected static array $children = [];

    /**
     * List all mapping activities.
     */
    public function getActivities(): array
    {
        return [
            'activities' => self::$activities,
            'assignments' => self::$assignments,
            'totalActivities' => count(self::$activities),
        ];
    }

    /**
     * Get single mapping activity by ID.
     */
    public function getActivityById(string $id): ?array
    {
        foreach (self::$activities as $activity) {
            if ($activity['id'] === $id) {
                return $activity;
            }
        }
        return null;
    }

    /**
     * Create a new mapping activity.
     */
    public function createActivity(array $data): array
    {
        $year = (int) ($data['year'] ?? 2026);
        $id = 'ACT-MAP-' . $year . '-' . str_pad((string) (count(self::$activities) + 1), 3, '0', STR_PAD_LEFT);

        $newActivity = [
            'id' => $id,
            'name' => $data['name'] ?? 'Annual Child Mapping',
            'year' => $year,
            'barangays' => $data['barangays'] ?? ['San Isidro'],
            'startDate' => $data['startDate'] ?? now()->toDateString(),
            'endDate' => $data['endDate'] ?? now()->addMonths(2)->toDateString(),
            'assignedWorkers' => $data['assignedWorkers'] ?? [],
            'status' => 'In Progress',
            'progress' => 0,
            'totalTargetHouseholds' => (int) ($data['totalTargetHouseholds'] ?? 150),
            'mappedHouseholds' => 0,
            'childrenIdentified' => 0,
            'archived' => false,
        ];

        self::$activities[] = $newActivity;

        // Auto-create assignments for assigned workers
        if (!empty($data['assignedWorkers']) && !empty($data['barangays'])) {
            foreach ($data['assignedWorkers'] as $worker) {
                self::$assignments[] = [
                    'workerId' => $worker['id'] ?? 'USR-FW-' . rand(100, 999),
                    'workerName' => $worker['name'] ?? 'Field Worker',
                    'assignedBarangay' => $data['barangays'][0],
                    'activityId' => $id,
                    'activityName' => $newActivity['name'],
                    'progress' => 0,
                    'householdsMapped' => 0,
                    'childrenIdentified' => 0,
                    'remainingHouseholds' => $newActivity['totalTargetHouseholds'],
                    'status' => 'Assigned',
                ];
            }
        }

        return $newActivity;
    }

    /**
     * Assign workers to an activity.
     */
    public function assignWorkers(string $activityId, array $workers, string $barangay): array
    {
        $activity = $this->getActivityById($activityId);
        if (!$activity) {
            return ['ok' => false, 'error' => 'Activity not found'];
        }

        foreach ($workers as $worker) {
            self::$assignments[] = [
                'workerId' => $worker['id'] ?? 'USR-FW-' . rand(100, 999),
                'workerName' => $worker['name'],
                'assignedBarangay' => $barangay,
                'activityId' => $activityId,
                'activityName' => $activity['name'],
                'progress' => 0,
                'householdsMapped' => 0,
                'childrenIdentified' => 0,
                'remainingHouseholds' => 80,
                'status' => 'Assigned',
            ];
        }

        return ['ok' => true, 'activityId' => $activityId, 'assignments' => self::$assignments];
    }

    /**
     * Get households list.
     */
    public function getHouseholds(): array
    {
        return self::$households;
    }

    /**
     * Get single household by ID.
     */
    public function getHouseholdById(string $id): ?array
    {
        foreach (self::$households as $hh) {
            if ($hh['id'] === $id) {
                return $hh;
            }
        }
        return null;
    }

    /**
     * Create new household record.
     */
    public function createHousehold(array $data): array
    {
        $id = $data['id'] ?? ('HH-2026-' . str_pad((string) (count(self::$households) + 101), 4, '0', STR_PAD_LEFT));

        $household = [
            'id' => $id,
            'parentGuardian' => $data['parentGuardian'] ?? 'N/A',
            'contactNumber' => $data['contactNumber'] ?? '',
            'address' => $data['address'] ?? '',
            'barangay' => $data['barangay'] ?? 'San Isidro',
            'mappingActivityId' => $data['mappingActivityId'] ?? 'ACT-MAP-2026-001',
            'mappedDate' => now()->toDateString(),
            'mappedBy' => $data['mappedBy'] ?? 'Field Worker',
            'childrenCount' => (int) ($data['childrenCount'] ?? 1),
            'status' => 'Completed',
        ];

        self::$households[] = $household;
        return $household;
    }

    /**
     * Search existing ECCD child records for duplication prevention.
     */
    public function searchChildren(string $query, ?string $birthDate = null): array
    {
        $query = strtolower(trim($query));
        $matches = [];

        foreach (self::$children as $child) {
            $fullName = strtolower($child['firstName'] . ' ' . $child['lastName']);
            $id = strtolower($child['id']);

            $nameMatch = !empty($query) && (str_contains($fullName, $query) || str_contains($id, $query));
            $dobMatch = !empty($birthDate) && ($child['birthDate'] === $birthDate);

            if ($nameMatch || $dobMatch) {
                $matches[] = $child;
            }
        }

        return $matches;
    }

    /**
     * Create or link child record.
     * Prevents duplicates if existing child ID is matched.
     */
    public function createChild(array $data): array
    {
        // If client indicates "This is the same child", link existing ID without duplicating
        if (!empty($data['existingChildId'])) {
            foreach (self::$children as &$existing) {
                if ($existing['id'] === $data['existingChildId']) {
                    if (!empty($data['householdId'])) {
                        $existing['householdId'] = $data['householdId'];
                    }
                    if (!empty($data['enrollmentStatus'])) {
                        $existing['enrollmentStatus'] = $data['enrollmentStatus'];
                    }
                    return [
                        'child' => $existing,
                        'isDuplicatePrevented' => true,
                        'message' => 'Existing child record linked to household. No duplicate created.',
                    ];
                }
            }
        }

        // Generate standardized unique child ID: ECCD-2026-001245
        $sequence = 1245 + count(self::$children);
        $uniqueId = 'ECCD-2026-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);

        $newChild = [
            'id' => $uniqueId,
            'firstName' => $data['firstName'] ?? '',
            'middleName' => $data['middleName'] ?? '',
            'lastName' => $data['lastName'] ?? '',
            'birthDate' => $data['birthDate'] ?? '2023-01-01',
            'sex' => $data['sex'] ?? 'Female',
            'ageYears' => (int) ($data['ageYears'] ?? 3),
            'ageMonths' => (int) ($data['ageMonths'] ?? 0),
            'householdId' => $data['householdId'] ?? 'HH-2026-0101',
            'parentGuardian' => $data['parentGuardian'] ?? '',
            'barangay' => $data['barangay'] ?? 'San Isidro',
            'enrollmentStatus' => $data['enrollmentStatus'] ?? 'Not Enrolled',
            'enrollmentCenter' => $data['enrollmentCenter'] ?? null,
            'matched' => false,
        ];

        self::$children[] = $newChild;

        return [
            'child' => $newChild,
            'isDuplicatePrevented' => false,
            'message' => 'New unique child ID generated and registered.',
        ];
    }
}
