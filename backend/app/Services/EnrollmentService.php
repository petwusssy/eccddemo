<?php

namespace App\Services;

class EnrollmentService
{
    /**
     * Master persistent enrollment dataset linked directly to ECCD Child IDs.
     * Core Rule: Reuses existing ECCD Child ID without creating duplicate children.
     */
    protected static array $enrollments = [];

    /**
     * Mapped but not yet enrolled children store.
     * Captures children identified during house-to-house mapping needing enrollment intervention.
     */
    protected static array $notEnrolledChildren = [];

    /**
     * GET /api/enrollments
     */
    public function getEnrollments(array $filters = []): array
    {
        $result = self::$enrollments;

        if (!empty($filters['search'])) {
            $q = strtolower(trim($filters['search']));
            $result = array_filter($result, function ($enr) use ($q) {
                return str_contains(strtolower($enr['childName']), $q)
                    || str_contains(strtolower($enr['childId']), $q)
                    || str_contains(strtolower($enr['barangay']), $q)
                    || str_contains(strtolower($enr['center']), $q);
            });
        }

        if (!empty($filters['barangay'])) {
            $result = array_filter($result, fn($e) => $e['barangay'] === $filters['barangay']);
        }

        if (!empty($filters['center'])) {
            $result = array_filter($result, fn($e) => $e['center'] === $filters['center']);
        }

        if (!empty($filters['schoolYear'])) {
            $result = array_filter($result, fn($e) => $e['schoolYear'] === $filters['schoolYear']);
        }

        return [
            'total' => count($result),
            'enrollments' => array_values($result),
        ];
    }

    /**
     * GET /api/enrollments/not-enrolled
     * Dedicated operational view: "Children Identified Through Mapping but Not Yet Enrolled"
     */
    public function getNotEnrolledChildren(array $filters = []): array
    {
        $result = self::$notEnrolledChildren;

        if (!empty($filters['barangay'])) {
            $result = array_filter($result, fn($c) => $c['barangay'] === $filters['barangay']);
        }

        if (!empty($filters['age'])) {
            $ageInt = (int) $filters['age'];
            $result = array_filter($result, fn($c) => $c['ageYears'] === $ageInt);
        }

        if (!empty($filters['year'])) {
            $yearInt = (int) $filters['year'];
            $result = array_filter($result, fn($c) => $c['mappingYear'] === $yearInt);
        }

        if (!empty($filters['status'])) {
            $result = array_filter($result, fn($c) => $c['status'] === $filters['status']);
        }

        return [
            'total' => count($result),
            'children' => array_values($result),
        ];
    }

    /**
     * POST /api/enrollments
     * ENROLL EXISTING CHILD: reuses existing ECCD Child ID without creating duplicate child record.
     */
    public function enrollChild(array $data): array
    {
        $childId = $data['childId'] ?? '';
        $existingChild = null;

        // Find from not enrolled list or search
        foreach (self::$notEnrolledChildren as $index => $c) {
            if ($c['childId'] === $childId) {
                $existingChild = $c;
                // Remove from not-enrolled list since child is now enrolled
                array_splice(self::$notEnrolledChildren, $index, 1);
                break;
            }
        }

        $id = 'ENR-2026-' . str_pad((string) (count(self::$enrollments) + 42), 4, '0', STR_PAD_LEFT);

        $newEnrollment = [
            'id' => $id,
            'childId' => $childId,
            'childName' => $data['childName'] ?? ($existingChild['childName'] ?? 'Enrolled Child'),
            'birthDate' => $data['birthDate'] ?? ($existingChild['birthDate'] ?? '2023-01-01'),
            'ageDisplay' => $data['ageDisplay'] ?? ($existingChild['ageDisplay'] ?? '3 yrs'),
            'sex' => $data['sex'] ?? ($existingChild['sex'] ?? 'Female'),
            'barangay' => $data['barangay'] ?? ($existingChild['barangay'] ?? 'San Isidro'),
            'center' => $data['center'] ?? 'San Isidro Child Development Center I',
            'program' => $data['program'] ?? 'Child Development Center (CDC)',
            'session' => $data['session'] ?? 'Morning Session (8:00 AM – 11:00 AM)',
            'schoolYear' => $data['schoolYear'] ?? 'SY 2026–2027',
            'enrollmentDate' => $data['enrollmentDate'] ?? now()->toDateString(),
            'status' => $data['status'] ?? 'Enrolled',
            'teacher' => $data['teacher'] ?? 'Assigned CDW Teacher',
            'previousRecords' => [],
        ];

        self::$enrollments[] = $newEnrollment;

        return [
            'enrollment' => $newEnrollment,
            'message' => "Child {$newEnrollment['childName']} ({$childId}) officially enrolled in {$newEnrollment['center']}. No duplicate child record created.",
            'lifecycleTransition' => 'Mapped → Not Enrolled → Enrolled (Success)',
        ];
    }

    /**
     * GET /api/children/{id}/enrollment
     */
    public function getChildEnrollment(string $childId): ?array
    {
        $history = [];
        $current = null;

        foreach (self::$enrollments as $enr) {
            if ($enr['childId'] === $childId) {
                if ($enr['status'] === 'Enrolled') {
                    $current = $enr;
                }
                $history[] = $enr;
            }
        }

        return [
            'childId' => $childId,
            'isEnrolled' => !empty($current),
            'currentEnrollment' => $current,
            'history' => $history,
        ];
    }

    /**
     * PUT /api/enrollments/{id}
     */
    public function updateEnrollment(string $id, array $data): ?array
    {
        foreach (self::$enrollments as &$enr) {
            if ($enr['id'] === $id) {
                $enr = array_merge($enr, $data);
                return $enr;
            }
        }
        return null;
    }
}
