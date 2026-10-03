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
     * GET /api/children
     */
    public function getChildren(array $filters = []): array
    {
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
        $sequence = 1245 + count(self::$children);
        $uniqueId = 'ECCD-2026-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);

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
