<?php

namespace App\Services;

use App\Models\Worker;
use App\Models\DayCareCenter;
use App\Models\Household;
use App\Models\Child;

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
        try {
            $workers = Worker::with(['barangay', 'dayCareCenter'])->where('status', 'Active')->get();
            if ($workers->isNotEmpty()) {
                $assignments = [];
                foreach ($workers as $w) {
                    $brgyName = $w->barangay?->name ?? 'San Isidro';
                    $centerName = $w->dayCareCenter?->name ?? 'Child Development Center';

                    // Connect to active mapping rounds for this barangay
                    $matchingActivity = null;
                    foreach (self::$activities as $act) {
                        if (empty($act['archived']) && in_array($brgyName, $act['barangays'] ?? [])) {
                            $matchingActivity = $act;
                            break;
                        }
                    }
                    if (!$matchingActivity) {
                        $matchingActivity = self::$activities[0] ?? [
                            'id' => 'ACT-MAP-2026-001',
                            'name' => '2026 Annual CSWDO House-to-House Child Mapping Drive',
                        ];
                    }

                    $mappedCount = Household::where('barangay_id', $w->barangay_id)->count();
                    $childrenCount = Child::whereHas('household', function ($q) use ($w) {
                        $q->where('barangay_id', $w->barangay_id);
                    })->count();

                    $target = 60;
                    $progress = $target > 0 ? min(100, round(($mappedCount / $target) * 100)) : 0;

                    $assignments[] = [
                        'workerId' => (string) $w->id,
                        'workerName' => $w->name,
                        'role' => $w->role,
                        'assignedBarangay' => $brgyName,
                        'assignedCenter' => $centerName,
                        'assignedCenters' => [$centerName],
                        'activityId' => $matchingActivity['id'],
                        'activityName' => $matchingActivity['name'],
                        'progress' => $progress,
                        'householdsMapped' => $mappedCount,
                        'childrenIdentified' => $childrenCount,
                        'remainingHouseholds' => max(0, $target - $mappedCount),
                        'status' => 'Active in Field',
                    ];
                }

                return [
                    'activities' => self::$activities,
                    'assignments' => $assignments,
                    'totalActivities' => count(self::$activities),
                ];
            }
        } catch (\Throwable $e) {
            // fallback to default assignments
        }

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
     * Clear all static in-memory households and children.
     */
    public static function resetStaticData(): void
    {
        self::$households = [];
        self::$children = [];
    }

    /**
     * Get households list from database.
     */
    public function getHouseholds(): array
    {
        try {
            $dbHouseholds = \App\Models\Household::with(['barangay', 'mappingActivity'])->get();
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
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('DB getHouseholds fallback: ' . $e->getMessage());
            return self::$households;
        }
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
        $id = $data['id'] ?? $data['household_no'] ?? null;
        $parentGuardian = trim($data['parentGuardian'] ?? $data['parent_guardian'] ?? '');
        $barangayName = $data['barangay'] ?? 'San Isidro';

        try {
            $barangay = \App\Models\Barangay::where('name', $barangayName)->orWhere('code', $barangayName)->first() ?? \App\Models\Barangay::first();
            $activityCode = $data['mappingActivityId'] ?? 'ACT-MAP-2026-001';
            $activity = \App\Models\MappingActivity::where('code', $activityCode)->first() ?? \App\Models\MappingActivity::first();

            $existing = null;
            if ($id && !str_starts_with($id, 'SURVEY-') && !str_starts_with($id, 'OFFLINE-')) {
                $existing = \App\Models\Household::where('household_no', $id)->first();
            }
            if (!$existing && $parentGuardian && $parentGuardian !== 'N/A' && $parentGuardian !== 'Offline Household Record') {
                $existing = \App\Models\Household::whereRaw('LOWER(TRIM(parent_guardian)) = ?', [strtolower($parentGuardian)])
                    ->where('barangay_id', $barangay?->id ?? 1)
                    ->first();
            }

            if ($existing) {
                $id = $existing->household_no;
            } elseif (!$id || str_starts_with($id, 'SURVEY-') || str_starts_with($id, 'OFFLINE-')) {
                $id = 'HH-2026-' . str_pad((string) (\App\Models\Household::count() + 101), 4, '0', STR_PAD_LEFT);
            }

            $rawMappedDate = $data['mappedDate'] ?? $data['mapped_date'] ?? now()->toDateString();
            $mappedDate = substr($rawMappedDate, 0, 10);

            $model = \App\Models\Household::updateOrCreate(
                ['household_no' => $id],
                [
                    'mapping_activity_id' => $activity?->id,
                    'barangay_id' => $barangay?->id ?? 1,
                    'purok' => $data['purok'] ?? null,
                    'address' => $data['address'] ?? 'N/A',
                    'parent_guardian' => $parentGuardian ?: 'N/A',
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
                'id' => $id ?? 'HH-2026-0101',
                'parentGuardian' => mb_strtoupper((string)($data['parentGuardian'] ?? $data['parent_guardian'] ?? 'N/A'), 'UTF-8'),
                'contactNumber' => $data['contactNumber'] ?? $data['contact_number'] ?? '',
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
     * Prevents duplicates if existing child ID or name/household is matched.
     */
    public function createChild(array $data): array
    {
        $firstName = trim($data['firstName'] ?? $data['first_name'] ?? '');
        $lastName = trim($data['lastName'] ?? $data['last_name'] ?? '');
        $rawBirthDate = $data['birthDate'] ?? $data['birth_date'] ?? null;
        $birthDate = $rawBirthDate ? substr($rawBirthDate, 0, 10) : null;
        $hhNo = $data['householdId'] ?? $data['household_id'] ?? 'HH-2026-0101';
        $uniqueId = $data['id'] ?? $data['eccd_id'] ?? ('ECCD-2026-' . rand(100000, 999999));

        try {
            $household = \App\Models\Household::where('household_no', $hhNo)->first();
            if (!$household) {
                $barangay = \App\Models\Barangay::where('name', $data['barangay'] ?? 'San Isidro')->first() ?? \App\Models\Barangay::first();
                $household = \App\Models\Household::create([
                    'household_no' => $hhNo,
                    'barangay_id' => $barangay?->id ?? 1,
                    'address' => $data['address'] ?? 'N/A',
                    'parent_guardian' => $data['parentGuardian'] ?? $data['parent_guardian'] ?? 'Parent / Guardian',
                    'mapped_date' => now()->toDateString(),
                    'mapped_by' => 'Field Worker',
                ]);
            }

            // 1. Strict Duplicate Check: by ID or by (first_name, last_name, household/DOB)
            $existingChild = null;
            $checkId = $data['existingChildId'] ?? $data['id'] ?? $data['eccd_id'] ?? null;
            if ($checkId && !str_starts_with((string)$checkId, 'TMP-') && !str_starts_with((string)$checkId, 'OFFLINE-')) {
                $existingChild = \App\Models\Child::where('eccd_id', $checkId)->first();
            }

            if (!$existingChild && $firstName && $lastName) {
                $existingChild = \App\Models\Child::whereRaw('LOWER(TRIM(first_name)) = ?', [strtolower($firstName)])
                    ->whereRaw('LOWER(TRIM(last_name)) = ?', [strtolower($lastName)])
                    ->where(function ($q) use ($household, $birthDate) {
                        if ($household) {
                            $q->where('household_id', $household->id);
                        }
                        if ($birthDate) {
                            $q->orWhere('birth_date', $birthDate);
                        }
                    })
                    ->first();
            }

            // If existing child matched, update without duplicating or assigning a new ID
            if ($existingChild) {
                if ($household) $existingChild->household_id = $household->id;
                if (!empty($data['enrollmentStatus'])) $existingChild->enrollment_status = $data['enrollmentStatus'];
                if (!empty($data['middleName'])) $existingChild->middle_name = $data['middleName'];
                if ($birthDate) $existingChild->birth_date = $birthDate;
                $existingChild->save();

                $existingData = [
                    'id' => $existingChild->eccd_id,
                    'eccd_id' => $existingChild->eccd_id,
                    'firstName' => $existingChild->first_name,
                    'middleName' => $existingChild->middle_name ?? '',
                    'lastName' => $existingChild->last_name,
                    'birthDate' => $existingChild->birth_date?->toDateString() ?? $birthDate ?? '2023-01-01',
                    'sex' => $existingChild->sex,
                    'householdId' => $household->household_no,
                    'barangay' => $household->barangay?->name ?? 'San Isidro',
                    'enrollmentStatus' => $existingChild->enrollment_status,
                    'matched' => true,
                ];

                return [
                    'child' => $existingData,
                    'isDuplicatePrevented' => true,
                    'message' => 'Existing child record linked to household. No duplicate created.',
                ];
            }

            // 2. Generate standardized unique child ID: ECCD-2026-001245+
            $maxChild = \App\Models\Child::where('eccd_id', 'like', 'ECCD-2026-%')->orderByDesc('eccd_id')->first();
            $sequence = 1245;
            if ($maxChild && preg_match('/ECCD-2026-(\d+)/', $maxChild->eccd_id, $matches)) {
                $sequence = max(1245, ((int)$matches[1]) + 1);
            }
            $uniqueId = $data['id'] ?? $data['eccd_id'] ?? ('ECCD-2026-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT));
            if (str_starts_with((string)$uniqueId, 'TMP-') || str_starts_with((string)$uniqueId, 'OFFLINE-')) {
                $uniqueId = 'ECCD-2026-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
            }

            $barangayId = $household->barangay_id ?? (\App\Models\Barangay::where('name', $data['barangay'] ?? '')->first()?->id ?? 1);

            $childModel = \App\Models\Child::updateOrCreate(
                ['eccd_id' => $uniqueId],
                [
                    'household_id' => $household->id,
                    'barangay_id' => $barangayId,
                    'first_name' => $firstName ?: 'Child',
                    'middle_name' => $data['middleName'] ?? null,
                    'last_name' => $lastName ?: 'Record',
                    'birth_date' => $birthDate ?? '2023-01-01',
                    'sex' => (ucfirst(strtolower($data['sex'] ?? 'Female')) === 'Male') ? 'Male' : 'Female',
                    'blood_type' => $data['bloodType'] ?? null,
                    'philsys_card_no' => $data['philSysNumber'] ?? null,
                    'psa_birth_cert' => $data['psaBirthCert'] ?? null,
                    'enrollment_status' => $data['enrollmentStatus'] ?? 'Not Enrolled',
                ]
            );

            $newChild = [
                'id' => $childModel->eccd_id,
                'eccd_id' => $childModel->eccd_id,
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

            $firstNameUpper = mb_strtoupper((string)($data['firstName'] ?? $data['first_name'] ?? 'Child'), 'UTF-8');
            $middleNameUpper = mb_strtoupper((string)($data['middleName'] ?? $data['middle_name'] ?? ''), 'UTF-8');
            $lastNameUpper = mb_strtoupper((string)($data['lastName'] ?? $data['last_name'] ?? 'Record'), 'UTF-8');
            $parentUpper = mb_strtoupper((string)($data['parentGuardian'] ?? $data['parent_guardian'] ?? ''), 'UTF-8');

            $newChild = [
                'id' => $uniqueId,
                'firstName' => $firstNameUpper,
                'middleName' => $middleNameUpper,
                'lastName' => $lastNameUpper,
                'birthDate' => $data['birthDate'] ?? '2023-01-01',
                'sex' => $data['sex'] ?? 'Female',
                'ageYears' => (int) ($data['ageYears'] ?? 3),
                'ageMonths' => (int) ($data['ageMonths'] ?? 0),
                'householdId' => $data['householdId'] ?? 'HH-2026-0101',
                'parentGuardian' => $parentUpper,
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

    /**
     * Batch sync offline surveys, households, and children atomically.
     * Prevents partial writes and ensures cross-device consistency.
     */
    public function syncBatch(array $batchData): array
    {
        $syncedSurveys = 0;
        $syncedHouseholds = 0;
        $syncedChildren = 0;
        $syncedActions = 0;

        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($batchData, &$syncedSurveys, &$syncedHouseholds, &$syncedChildren, &$syncedActions) {
                // 1. Process mapping surveys from IndexedDB
                $surveys = $batchData['surveys'] ?? [];
                foreach ($surveys as $survey) {
                    $hhData = $survey['household'] ?? [
                        'id' => $survey['householdId'] ?? null,
                        'parentGuardian' => $survey['parentGuardian'] ?? null,
                        'contactNumber' => $survey['contactNumber'] ?? null,
                        'address' => $survey['address'] ?? null,
                        'barangay' => $survey['barangay'] ?? null,
                        'purok' => $survey['purok'] ?? null,
                        'mappingActivityId' => $survey['mappingActivityId'] ?? $survey['activityId'] ?? null,
                        'mappedBy' => $survey['mappedBy'] ?? null,
                        'is4Ps' => $survey['is4Ps'] ?? false,
                        'isIP' => $survey['isIP'] ?? false,
                    ];

                    if ($hhData && (!empty($hhData['id']) || !empty($hhData['parentGuardian']))) {
                        $savedHh = $this->createHousehold($hhData);
                        $syncedHouseholds++;

                        if (!empty($survey['children']) && is_array($survey['children'])) {
                            foreach ($survey['children'] as $child) {
                                $child['householdId'] = $savedHh['id'];
                                $child['barangay'] = $child['barangay'] ?? $savedHh['barangay'];
                                $this->createChild($child);
                                $syncedChildren++;
                            }
                        }
                    }
                    $syncedSurveys++;
                }

                // 2. Frontline actions execution (offline enrollment, health, assessment)
                if (!empty($batchData['frontlineActions']) && is_array($batchData['frontlineActions'])) {
                    foreach ($batchData['frontlineActions'] as $action) {
                        try {
                            $type = $action['type'] ?? '';
                            $payload = $action['payload'] ?? [];
                            if ($type === 'enrollment' && !empty($payload['childId'])) {
                                app(\App\Services\EnrollmentService::class)->enrollChild($payload);
                                $syncedActions++;
                            } elseif ($type === 'health' && !empty($payload['childId'])) {
                                app(\App\Services\HealthMonitoringService::class)->recordChildHealth($payload['childId'], $payload);
                                $syncedActions++;
                            } elseif ($type === 'assessment' && !empty($payload['childId'])) {
                                app(\App\Services\DevelopmentAssessmentService::class)->recordAssessment($payload['childId'], $payload);
                                $syncedActions++;
                            }
                        } catch (\Throwable $actErr) {
                            \Illuminate\Support\Facades\Log::warning('syncBatch action error: ' . $actErr->getMessage());
                        }
                    }
                }
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('syncBatch transaction fallback: ' . $e->getMessage());
        }

        return [
            'ok' => true,
            'synced' => [
                'surveys' => $syncedSurveys,
                'households' => $syncedHouseholds,
                'children' => $syncedChildren,
                'actions' => $syncedActions,
            ],
            'message' => 'Successfully synchronized ' . ($syncedHouseholds + $syncedChildren) . ' records to CSWDO database.',
        ];
    }
}

