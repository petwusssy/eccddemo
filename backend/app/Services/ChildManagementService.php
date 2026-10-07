<?php

namespace App\Services;

class ChildManagementService
{
    /**
     * Master dataset for persistent child records in City of San Fernando, Pampanga.
     * Centralized store: ONE CHILD = ONE PERSISTENT RECORD.
     */
    protected static array $children = [];

    /**
     * Helper to format Eloquent Child into API contract response format.
     */
    protected function formatChildModel(\App\Models\Child $child): array
    {
        $birthDate = $child->birth_date;
        $now = now();
        $ageYears = (int) ($birthDate ? $birthDate->diffInYears($now) : 3);
        $ageMonths = (int) ($birthDate ? ($birthDate->diffInMonths($now) % 12) : 0);

        $enrollmentStatus = $child->enrollment_status ?? 'Not Enrolled';
        $healthStatus = $child->health_status ?? 'Normal';
        $developmentStatus = $child->development_status ?? 'Normal';
        $hasFollowUp = (bool) $child->has_open_follow_up;

        $hhNo = $child->household?->household_no ?? 'HH-2026-0101';
        $guardian = $child->household?->parent_guardian ?? '';
        $address = $child->household?->address ?? '';
        $contact = $child->household?->contact_number ?? '';
        $brgyName = $child->barangay?->name ?? 'San Isidro';

        return [
            'id' => $child->eccd_id,
            'eccd_id' => $child->eccd_id,
            'firstName' => $child->first_name,
            'middleName' => $child->middle_name ?? '',
            'lastName' => $child->last_name,
            'fullName' => trim($child->first_name . ' ' . $child->middle_name . ' ' . $child->last_name . ' ' . $child->suffix),
            'birthDate' => $birthDate ? $birthDate->toDateString() : '2023-01-01',
            'ageYears' => (int) $ageYears,
            'ageMonths' => (int) $ageMonths,
            'ageDisplay' => $ageYears . ' yrs',
            'sex' => $child->sex,
            'bloodType' => $child->blood_type ?? 'N/A',
            'philSysNumber' => $child->philsys_card_no ?? 'N/A',
            'psaBirthCert' => $child->psa_birth_cert ?? 'N/A',
            'barangay' => $brgyName,
            'purok' => $child->household?->purok ?? 'Purok 1',
            'address' => $address,
            'householdId' => $hhNo,
            'parentGuardian' => $guardian,
            'guardianRelationship' => 'Parent / Guardian',
            'contactNumber' => $contact,
            'emergencyContact' => $contact,
            'is4PsBeneficiary' => (bool) ($child->household?->is_4ps ?? false),
            'monthlyIncomeClass' => $child->household?->monthly_income_class ?? 'Low Income',
            'assignedWorker' => 'CSWDO Worker',
            'assignedWorkerContact' => '0917-555-0100',
            'assignedCenter' => $child->dayCareCenter?->name ?? ($brgyName . ' CDC I'),
            'enrollmentStatus' => $enrollmentStatus,
            'healthStatus' => $healthStatus,
            'developmentStatus' => $developmentStatus,
            'hasOpenFollowUp' => $hasFollowUp,
            'statusPillars' => [
                'mapped' => ['status' => 'Mapped', 'variant' => 'success', 'date' => $child->created_at?->toDateString() ?? now()->toDateString()],
                'enrolled' => ['status' => $enrollmentStatus, 'variant' => $enrollmentStatus === 'Enrolled' ? 'success' : 'neutral'],
                'health' => ['status' => $healthStatus, 'variant' => 'neutral'],
                'development' => ['status' => $developmentStatus, 'variant' => 'neutral'],
                'followUp' => ['status' => $hasFollowUp ? 'Needs Attention' : 'None', 'variant' => $hasFollowUp ? 'danger' : 'neutral'],
            ],
            'healthRecords' => [],
            'developmentAssessments' => [],
            'followUpCases' => [],
            'timeline' => [
                [
                    'id' => 'TL-NEW',
                    'type' => 'Community Mapping',
                    'title' => 'Child Record Registered',
                    'description' => 'Master persistent record registered in CSWDO database.',
                    'date' => $child->created_at?->toDateString() ?? now()->toDateString(),
                    'author' => 'CSWDO Field Officer',
                    'badgeVariant' => 'success',
                ],
            ],
            'familyHousehold' => [
                'householdId' => $hhNo,
                'parentGuardian' => $guardian,
                'address' => $address,
                'barangay' => $brgyName,
                'totalFamilyMembers' => 3,
                'coResidentChildren' => [],
            ],
        ];
    }

    /**
     * GET /api/children
     */
    public function getChildren(array $filters = []): array
    {
        try {
            $query = \App\Models\Child::with(['household', 'barangay', 'dayCareCenter']);

            if (!empty($filters['search'])) {
                $q = trim($filters['search']);
                $query->where(function ($sub) use ($q) {
                    $sub->where('first_name', 'like', "%{$q}%")
                        ->orWhere('last_name', 'like', "%{$q}%")
                        ->orWhere('eccd_id', 'like', "%{$q}%");
                });
            }

            if (!empty($filters['barangay'])) {
                $query->whereHas('barangay', function ($bQuery) use ($filters) {
                    $bQuery->where('name', $filters['barangay']);
                });
            }

            if (!empty($filters['enrollmentStatus'])) {
                $query->where('enrollment_status', $filters['enrollmentStatus']);
            }

            if (!empty($filters['sex'])) {
                $query->where('sex', $filters['sex']);
            }

            $dbChildren = $query->get();
            if ($dbChildren->isNotEmpty()) {
                $formatted = $dbChildren->map(fn($c) => $this->formatChildModel($c))->toArray();
                return [
                    'total' => count($formatted),
                    'children' => $formatted,
                ];
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('DB getChildren fallback: ' . $e->getMessage());
        }

        $result = self::$children;

        // Search query
        if (!empty($filters['search'])) {
            $q = strtolower(trim($filters['search']));
            $result = array_filter($result, function ($c) use ($q) {
                return str_contains(strtolower($c['fullName']), $q)
                    || str_contains(strtolower($c['id']), $q)
                    || str_contains(strtolower($c['householdId']), $q)
                    || str_contains(strtolower($c['barangay']), $q)
                    || str_contains(strtolower($c['assignedCenter']), $q);
            });
        }

        // Barangay filter
        if (!empty($filters['barangay'])) {
            $result = array_filter($result, fn($c) => $c['barangay'] === $filters['barangay']);
        }

        // Enrollment status filter
        if (!empty($filters['enrollmentStatus'])) {
            $result = array_filter($result, fn($c) => $c['statusPillars']['enrolled']['status'] === $filters['enrollmentStatus']);
        }

        // Sex filter
        if (!empty($filters['sex'])) {
            $result = array_filter($result, fn($c) => $c['sex'] === $filters['sex']);
        }

        return [
            'total' => count($result),
            'children' => array_values($result),
        ];
    }

    /**
     * GET /api/children/{id}
     */
    public function getChildById(string $id): ?array
    {
        try {
            $child = \App\Models\Child::where('eccd_id', $id)->with(['household', 'barangay', 'dayCareCenter'])->first();
            if ($child) {
                return $this->formatChildModel($child);
            }
        } catch (\Throwable $e) { }

        foreach (self::$children as $child) {
            if ($child['id'] === $id) {
                return $child;
            }
        }
        return null;
    }

    /**
     * GET /api/children/{id}/timeline
     */
    public function getTimeline(string $id): array
    {
        $child = $this->getChildById($id);
        return $child ? ($child['timeline'] ?? []) : [];
    }

    /**
     * GET /api/children/{id}/household
     */
    public function getHousehold(string $id): ?array
    {
        $child = $this->getChildById($id);
        return $child ? ($child['familyHousehold'] ?? null) : null;
    }

    /**
     * GET /api/children/{id}/status
     */
    public function getStatusPillars(string $id): ?array
    {
        $child = $this->getChildById($id);
        return $child ? ($child['statusPillars'] ?? null) : null;
    }

    /**
     * POST /api/children
     */
    public function createChild(array $data): array
    {
        $count = \App\Models\Child::count() ?: count(self::$children);
        $sequence = 1245 + $count;
        $uniqueId = $data['id'] ?? $data['eccd_id'] ?? null;
        if (!$uniqueId || str_starts_with((string)$uniqueId, 'TMP-') || str_starts_with((string)$uniqueId, 'OFFLINE-')) {
            $uniqueId = 'ECCD-2026-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
        }

        try {
            $hhNo = $data['householdId'] ?? $data['household_id'] ?? 'HH-2026-0101';
            $household = \App\Models\Household::where('household_no', $hhNo)->first();
            if (!$household) {
                $barangay = \App\Models\Barangay::where('name', $data['barangay'] ?? 'San Isidro')->first() ?? \App\Models\Barangay::first();
                $household = \App\Models\Household::create([
                    'household_no' => $hhNo,
                    'barangay_id' => $barangay?->id ?? 1,
                    'address' => $data['address'] ?? 'N/A',
                    'parent_guardian' => $data['parentGuardian'] ?? $data['parent_guardian'] ?? 'Parent / Guardian',
                    'contact_number' => $data['contactNumber'] ?? $data['contact_number'] ?? null,
                    'mapped_date' => now()->toDateString(),
                    'mapped_by' => $data['assignedWorker'] ?? 'Field Worker',
                ]);
            }

            $barangayId = $household->barangay_id ?? (\App\Models\Barangay::where('name', $data['barangay'] ?? '')->first()?->id ?? 1);

            $rawBirthDate = $data['birthDate'] ?? $data['birth_date'] ?? '2023-01-01';
            $birthDate = substr($rawBirthDate, 0, 10);

            $childModel = \App\Models\Child::updateOrCreate(
                ['eccd_id' => $uniqueId],
                [
                    'household_id' => $household->id,
                    'barangay_id' => $barangayId,
                    'first_name' => $data['firstName'] ?? $data['first_name'] ?? 'Child',
                    'middle_name' => $data['middleName'] ?? $data['middle_name'] ?? null,
                    'last_name' => $data['lastName'] ?? $data['last_name'] ?? 'Record',
                    'birth_date' => $birthDate,
                    'sex' => (ucfirst(strtolower($data['sex'] ?? 'Female')) === 'Male') ? 'Male' : 'Female',
                    'blood_type' => $data['bloodType'] ?? $data['blood_type'] ?? null,
                    'philsys_card_no' => $data['philSysNumber'] ?? $data['philsys_card_no'] ?? null,
                    'psa_birth_cert' => $data['psaBirthCert'] ?? $data['psa_birth_cert'] ?? null,
                    'enrollment_status' => $data['enrollmentStatus'] ?? $data['enrollment_status'] ?? 'Not Enrolled',
                ]
            );

            $formatted = $this->formatChildModel($childModel->load(['household', 'barangay']));
            self::$children[] = $formatted;
            return $formatted;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('DB createChild in ChildManagementService error: ' . $e->getMessage());

            $newChild = [
                'id' => $uniqueId,
                'firstName' => $data['firstName'] ?? '',
                'middleName' => $data['middleName'] ?? '',
                'lastName' => $data['lastName'] ?? '',
                'fullName' => trim(($data['firstName'] ?? '') . ' ' . ($data['middleName'] ?? '') . ' ' . ($data['lastName'] ?? '')),
                'birthDate' => $data['birthDate'] ?? '2023-01-01',
                'ageYears' => (int) ($data['ageYears'] ?? 3),
                'ageMonths' => (int) ($data['ageMonths'] ?? 0),
                'ageDisplay' => ($data['ageYears'] ?? 3) . ' yrs',
                'sex' => $data['sex'] ?? 'Female',
                'bloodType' => $data['bloodType'] ?? 'N/A',
                'philSysNumber' => $data['philSysNumber'] ?? 'N/A',
                'psaBirthCert' => $data['psaBirthCert'] ?? 'N/A',
                'barangay' => $data['barangay'] ?? 'San Isidro',
                'purok' => $data['purok'] ?? 'Purok 1',
                'address' => $data['address'] ?? '',
                'householdId' => $data['householdId'] ?? 'HH-2026-0101',
                'parentGuardian' => $data['parentGuardian'] ?? '',
                'guardianRelationship' => $data['guardianRelationship'] ?? 'Mother',
                'contactNumber' => $data['contactNumber'] ?? '',
                'emergencyContact' => $data['emergencyContact'] ?? '',
                'is4PsBeneficiary' => (bool) ($data['is4PsBeneficiary'] ?? false),
                'monthlyIncomeClass' => $data['monthlyIncomeClass'] ?? 'Low Income',
                'assignedWorker' => $data['assignedWorker'] ?? 'CSWDO Worker',
                'assignedWorkerContact' => '0917-555-0100',
                'assignedCenter' => $data['assignedCenter'] ?? 'San Isidro CDC I',
                'statusPillars' => [
                    'mapped' => ['status' => 'Mapped', 'variant' => 'success', 'date' => now()->toDateString()],
                    'enrolled' => ['status' => $data['enrollmentStatus'] ?? 'Not Enrolled', 'variant' => 'neutral'],
                    'health' => ['status' => 'Pending Assessment', 'variant' => 'neutral'],
                    'development' => ['status' => 'Pending Evaluation', 'variant' => 'neutral'],
                    'followUp' => ['status' => 'None', 'variant' => 'neutral'],
                ],
                'healthRecords' => [],
                'developmentAssessments' => [],
                'followUpCases' => [],
                'timeline' => [
                    [
                        'id' => 'TL-NEW',
                        'type' => 'Community Mapping',
                        'title' => 'Child Record Registered',
                        'description' => 'Master persistent record registered in CSWDO database.',
                        'date' => now()->toDateString(),
                        'author' => 'CSWDO Field Officer',
                        'badgeVariant' => 'success',
                    ],
                ],
                'familyHousehold' => [
                    'householdId' => $data['householdId'] ?? 'HH-2026-0101',
                    'parentGuardian' => $data['parentGuardian'] ?? '',
                    'address' => $data['address'] ?? '',
                    'barangay' => $data['barangay'] ?? 'San Isidro',
                    'totalFamilyMembers' => 3,
                    'coResidentChildren' => [],
                ],
            ];

            self::$children[] = $newChild;
            return $newChild;
        }
    }

    /**
     * PUT /api/children/{id}
     */
    public function updateChild(string $id, array $data): ?array
    {
        foreach (self::$children as &$child) {
            if ($child['id'] === $id) {
                $child = array_merge($child, $data);
                return $child;
            }
        }
        return null;
    }

    /**
     * Add event to timeline and record action (Enrollment, Health, Dev, Follow-up)
     */
    public function addTimelineEvent(string $id, array $eventData): bool
    {
        foreach (self::$children as &$child) {
            if ($child['id'] === $id) {
                $newEvent = [
                    'id' => 'TL-' . rand(100, 999),
                    'type' => $eventData['type'] ?? 'Action',
                    'title' => $eventData['title'] ?? 'Updated Record',
                    'description' => $eventData['description'] ?? '',
                    'date' => now()->toDateString(),
                    'author' => $eventData['author'] ?? 'CSWDO Worker',
                    'badgeVariant' => $eventData['badgeVariant'] ?? 'primary',
                ];
                array_unshift($child['timeline'], $newEvent);
                return true;
            }
        }
        return false;
    }
}
