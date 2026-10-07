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
     * Get households list from database.
     */
    public function getHouseholds(): array
    {
        try {
            $dbHouseholds = \App\Models\Household::with(['barangay', 'mappingActivity'])->get();
            if ($dbHouseholds->isNotEmpty()) {
                return $dbHouseholds->map(function ($hh) {
                    return [
                        'id' => $hh->household_no,
                        'household_no' => $hh->household_no,
                        'parentGuardian' => $hh->parent_guardian,
                        'contactNumber' => $hh->contact_number,
                        'address' => $hh->address,
                        'barangay' => $hh->barangay?->name ?? 'San Isidro',
                        'mappingActivityId' => $hh->mappingActivity?->code ?? 'ACT-MAP-2026-001',
                        'mappedDate' => $hh->mapped_date?->toDateString() ?? now()->toDateString(),
                        'mappedBy' => $hh->mapped_by ?? 'Field Worker',
                        'childrenCount' => $hh->children()->count() ?: 1,
                        'status' => 'Completed',
                    ];
                })->toArray();
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('DB getHouseholds fallback: ' . $e->getMessage());
        }

        return self::$households;
    }

    /**
     * Get single household by ID.
     */
    public function getHouseholdById(string $id): ?array
    {
        try {
            $hh = \App\Models\Household::where('household_no', $id)->with(['barangay', 'mappingActivity'])->first();
            if ($hh) {
                return [
                    'id' => $hh->household_no,
                    'household_no' => $hh->household_no,
                    'parentGuardian' => $hh->parent_guardian,
                    'contactNumber' => $hh->contact_number,
                    'address' => $hh->address,
                    'barangay' => $hh->barangay?->name ?? 'San Isidro',
                    'mappingActivityId' => $hh->mappingActivity?->code ?? 'ACT-MAP-2026-001',
                    'mappedDate' => $hh->mapped_date?->toDateString() ?? now()->toDateString(),
                    'mappedBy' => $hh->mapped_by ?? 'Field Worker',
                    'childrenCount' => $hh->children()->count() ?: 1,
                    'status' => 'Completed',
                ];
            }
        } catch (\Throwable $e) { }

        foreach (self::$households as $h) {
            if ($h['id'] === $id) {
                return $h;
            }
        }
        return null;
    }

    /**
     * Create new household record in MySQL.
     */
    public function createHousehold(array $data): array
    {
        $id = $data['id'] ?? $data['household_no'] ?? ('HH-2026-' . str_pad((string) (\App\Models\Household::count() + 101), 4, '0', STR_PAD_LEFT));
        $barangayName = $data['barangay'] ?? 'San Isidro';

        try {
            $barangay = \App\Models\Barangay::where('name', $barangayName)->orWhere('code', $barangayName)->first() ?? \App\Models\Barangay::first();
            $activityCode = $data['mappingActivityId'] ?? 'ACT-MAP-2026-001';
            $activity = \App\Models\MappingActivity::where('code', $activityCode)->first() ?? \App\Models\MappingActivity::first();

            $rawMappedDate = $data['mappedDate'] ?? $data['mapped_date'] ?? now()->toDateString();
            $mappedDate = substr($rawMappedDate, 0, 10);

            $model = \App\Models\Household::updateOrCreate(
                ['household_no' => $id],
                [
                    'mapping_activity_id' => $activity?->id,
                    'barangay_id' => $barangay?->id ?? 1,
                    'purok' => $data['purok'] ?? null,
                    'address' => $data['address'] ?? 'N/A',
                    'parent_guardian' => $data['parentGuardian'] ?? $data['parent_guardian'] ?? 'N/A',
                    'contact_number' => $data['contactNumber'] ?? $data['contact_number'] ?? null,
                    'is_4ps' => !empty($data['is4Ps']) || !empty($data['is_4ps']),
                    'is_ip' => !empty($data['isIP']) || !empty($data['is_ip']),
                    'mapped_date' => $mappedDate,
                    'mapped_by' => $data['mappedBy'] ?? $data['mapped_by'] ?? 'Field Worker',
                ]
            );

            $household = [
                'id' => $model->household_no,
                'household_no' => $model->household_no,
                'parentGuardian' => $model->parent_guardian,
                'contactNumber' => $model->contact_number,
                'address' => $model->address,
                'barangay' => $model->barangay?->name ?? $barangayName,
                'purok' => $model->purok,
                'mappingActivityId' => $activityCode,
                'mappedDate' => $model->mapped_date?->toDateString() ?? now()->toDateString(),
                'mappedBy' => $model->mapped_by,
                'childrenCount' => (int) ($data['childrenCount'] ?? 1),
                'status' => 'Completed',
            ];

            self::$households[] = $household;
            return $household;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('DB createHousehold error: ' . $e->getMessage());

            $fallback = [
                'id' => $id,
                'parentGuardian' => $data['parentGuardian'] ?? 'N/A',
                'contactNumber' => $data['contactNumber'] ?? '',
                'address' => $data['address'] ?? '',
                'barangay' => $barangayName,
                'mappingActivityId' => $data['mappingActivityId'] ?? 'ACT-MAP-2026-001',
                'mappedDate' => now()->toDateString(),
                'mappedBy' => $data['mappedBy'] ?? 'Field Worker',
                'childrenCount' => (int) ($data['childrenCount'] ?? 1),
                'status' => 'Completed',
            ];
            self::$households[] = $fallback;
            return $fallback;
        }
    }

    /**
     * Search existing ECCD child records for duplication prevention.
     */
    public function searchChildren(string $query, ?string $birthDate = null): array
    {
        $query = strtolower(trim($query));
        $matches = [];

        try {
            $dbChildren = \App\Models\Child::with(['household', 'barangay'])
                ->when(!empty($query), function ($q) use ($query) {
                    $q->where(function ($sub) use ($query) {
                        $sub->where('first_name', 'like', "%{$query}%")
                            ->orWhere('last_name', 'like', "%{$query}%")
                            ->orWhere('eccd_id', 'like', "%{$query}%");
                    });
                })
                ->when(!empty($birthDate), function ($q) use ($birthDate) {
                    $q->where('birth_date', $birthDate);
                })
                ->get();

            foreach ($dbChildren as $child) {
                $matches[] = [
                    'id' => $child->eccd_id,
                    'firstName' => $child->first_name,
                    'lastName' => $child->last_name,
                    'birthDate' => $child->birth_date?->toDateString(),
                    'sex' => $child->sex,
                    'barangay' => $child->barangay?->name ?? 'San Isidro',
                    'householdId' => $child->household?->household_no ?? 'HH-2026-0101',
                ];
            }
            if (!empty($matches)) {
                return $matches;
            }
        } catch (\Throwable $e) { }

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
     * Create or link child record in MySQL.
     * Prevents duplicates if existing child ID is matched.
     */
    public function createChild(array $data): array
    {
        // If client indicates "This is the same child", link existing ID without duplicating
        if (!empty($data['existingChildId'])) {
            try {
                $existing = \App\Models\Child::where('eccd_id', $data['existingChildId'])->first();
                if ($existing) {
                    if (!empty($data['householdId'])) {
                        $hh = \App\Models\Household::where('household_no', $data['householdId'])->first();
                        if ($hh) $existing->household_id = $hh->id;
                    }
                    if (!empty($data['enrollmentStatus'])) {
                        $existing->enrollment_status = $data['enrollmentStatus'];
                    }
                    $existing->save();
                    return [
                        'child' => [
                            'id' => $existing->eccd_id,
                            'firstName' => $existing->first_name,
                            'lastName' => $existing->last_name,
                            'householdId' => $data['householdId'] ?? 'HH-2026-0101',
                        ],
                        'isDuplicatePrevented' => true,
                        'message' => 'Existing child record linked to household. No duplicate created.',
                    ];
                }
            } catch (\Throwable $e) { }
        }

        // Generate standardized unique child ID: ECCD-2026-001245
        $count = \App\Models\Child::count() ?: count(self::$children);
        $sequence = 1245 + $count;
        $uniqueId = $data['id'] ?? ('ECCD-2026-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT));

        try {
            $hhNo = $data['householdId'] ?? 'HH-2026-0101';
            $household = \App\Models\Household::where('household_no', $hhNo)->first();
            if (!$household) {
                $barangay = \App\Models\Barangay::where('name', $data['barangay'] ?? 'San Isidro')->first() ?? \App\Models\Barangay::first();
                $household = \App\Models\Household::create([
                    'household_no' => $hhNo,
                    'barangay_id' => $barangay?->id ?? 1,
                    'address' => $data['address'] ?? 'N/A',
                    'parent_guardian' => $data['parentGuardian'] ?? 'Parent / Guardian',
                    'mapped_date' => now()->toDateString(),
                    'mapped_by' => 'Field Worker',
                ]);
            }

            $barangayId = $household->barangay_id ?? (\App\Models\Barangay::where('name', $data['barangay'] ?? '')->first()?->id ?? 1);

            $childModel = \App\Models\Child::updateOrCreate(
                ['eccd_id' => $uniqueId],
                [
                    'household_id' => $household->id,
                    'barangay_id' => $barangayId,
                    'first_name' => $data['firstName'] ?? 'Child',
                    'middle_name' => $data['middleName'] ?? null,
                    'last_name' => $data['lastName'] ?? 'Record',
                    'birth_date' => $data['birthDate'] ?? '2023-01-01',
                    'sex' => (ucfirst(strtolower($data['sex'] ?? 'Female')) === 'Male') ? 'Male' : 'Female',
                    'blood_type' => $data['bloodType'] ?? null,
                    'philsys_card_no' => $data['philSysNumber'] ?? null,
                    'psa_birth_cert' => $data['psaBirthCert'] ?? null,
                    'enrollment_status' => $data['enrollmentStatus'] ?? 'Not Enrolled',
                ]
            );

            $newChild = [
                'id' => $childModel->eccd_id,
                'firstName' => $childModel->first_name,
                'middleName' => $childModel->middle_name ?? '',
                'lastName' => $childModel->last_name,
                'birthDate' => $childModel->birth_date?->toDateString() ?? '2023-01-01',
                'sex' => $childModel->sex,
                'householdId' => $hhNo,
                'barangay' => $household->barangay?->name ?? 'San Isidro',
                'enrollmentStatus' => $childModel->enrollment_status,
                'matched' => false,
            ];

            self::$children[] = $newChild;

            return [
                'child' => $newChild,
                'isDuplicatePrevented' => false,
                'message' => 'New unique child ID generated and registered in MySQL.',
            ];
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('DB createChild error: ' . $e->getMessage());

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
}
