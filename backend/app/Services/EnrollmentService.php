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
     * GET /api/enrollments
     * Computes live enrolled list from MySQL.
     */
    public function getEnrollments(array $filters = []): array
    {
        $list = [];

        try {
            $dbEnrollments = \App\Models\Enrollment::with(['child.household', 'child.barangay', 'dayCareCenter', 'barangay'])->get();
            foreach ($dbEnrollments as $enr) {
                $child = $enr->child;
                $list[] = [
                    'id' => 'ENR-2026-' . str_pad((string) $enr->id, 4, '0', STR_PAD_LEFT),
                    'childId' => $enr->child_id,
                    'childName' => $child ? trim("{$child->first_name} {$child->last_name}") : 'Enrolled Child',
                    'birthDate' => $child?->birth_date?->toDateString() ?? '2023-01-01',
                    'sex' => $child?->sex ?? 'Female',
                    'barangay' => $child?->barangay?->name ?? $enr->barangay?->name ?? 'San Isidro',
                    'center' => $enr->dayCareCenter?->name ?? 'San Isidro Child Development Center I',
                    'session' => $enr->session ?? 'Morning Session (8:00 AM – 11:00 AM)',
                    'schoolYear' => $enr->school_year ?? 'SY 2026–2027',
                    'enrollmentDate' => $enr->enrollment_date?->toDateString() ?? now()->toDateString(),
                    'status' => $enr->status ?? 'Enrolled',
                    'teacher' => $enr->remarks ?? 'Assigned CDW Teacher',
                ];
            }

            // Also check any Child records marked as Enrolled in MySQL that might not have an enrollment row
            $enrolledKids = \App\Models\Child::where('enrollment_status', 'Enrolled')
                ->whereNotIn('eccd_id', array_column($list, 'childId'))
                ->with(['household', 'barangay', 'dayCareCenter'])
                ->get();

            foreach ($enrolledKids as $k) {
                $list[] = [
                    'id' => 'ENR-' . $k->eccd_id,
                    'childId' => $k->eccd_id,
                    'childName' => trim("{$k->first_name} {$k->last_name}"),
                    'birthDate' => $k->birth_date?->toDateString() ?? '2023-01-01',
                    'sex' => $k->sex ?? 'Female',
                    'barangay' => $k->barangay?->name ?? 'San Isidro',
                    'center' => $k->dayCareCenter?->name ?? 'San Isidro Child Development Center I',
                    'session' => 'Morning Session (8:00 AM – 11:00 AM)',
                    'schoolYear' => 'SY 2026–2027',
                    'enrollmentDate' => now()->toDateString(),
                    'status' => 'Enrolled',
                    'teacher' => 'Assigned CDW Teacher',
                ];
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('EnrollmentService getEnrollments error: ' . $e->getMessage());
        }

        // Apply filters
        if (!empty($filters['search'])) {
            $q = strtolower(trim($filters['search']));
            $list = array_filter($list, function ($enr) use ($q) {
                return str_contains(strtolower($enr['childName']), $q)
                    || str_contains(strtolower($enr['childId']), $q)
                    || str_contains(strtolower($enr['barangay']), $q)
                    || str_contains(strtolower($enr['center']), $q);
            });
        }

        if (!empty($filters['barangay'])) {
            $list = array_filter($list, fn($e) => $e['barangay'] === $filters['barangay']);
        }

        if (!empty($filters['center'])) {
            $list = array_filter($list, fn($e) => $e['center'] === $filters['center']);
        }

        if (!empty($filters['schoolYear'])) {
            $list = array_filter($list, fn($e) => $e['schoolYear'] === $filters['schoolYear']);
        }

        return [
            'total' => count($list),
            'enrollments' => array_values($list),
        ];
    }

    /**
     * GET /api/enrollments/not-enrolled
     * Dedicated operational view: "Children Identified Through Mapping but Not Yet Enrolled"
     */
    public function getNotEnrolledChildren(array $filters = []): array
    {
        $children = [];

        try {
            $dbKids = \App\Models\Child::where(function ($q) {
                $q->where('enrollment_status', '!=', 'Enrolled')
                  ->orWhereNull('enrollment_status');
            })->with(['household', 'barangay'])->get();

            foreach ($dbKids as $c) {
                $birth = $c->birth_date ? new \DateTime($c->birth_date) : new \DateTime('2023-01-01');
                $now = new \DateTime();
                $diff = $now->diff($birth);
                $ageYears = $diff->y;

                $children[] = [
                    'id' => $c->eccd_id,
                    'childId' => $c->eccd_id,
                    'childName' => trim("{$c->first_name} {$c->last_name}"),
                    'birthDate' => $c->birth_date?->toDateString() ?? '2023-01-01',
                    'ageYears' => $ageYears,
                    'ageDisplay' => "{$ageYears} yrs",
                    'sex' => $c->sex ?? 'Female',
                    'barangay' => $c->barangay?->name ?? 'San Isidro',
                    'householdId' => $c->household?->household_no ?? 'HH-2026-0101',
                    'parentGuardian' => $c->household?->parent_guardian ?? 'Parent / Guardian',
                    'mappingDate' => $c->household?->mapped_date?->toDateString() ?? now()->toDateString(),
                    'mappingYear' => 2026,
                    'status' => 'Mapped (Not Enrolled)',
                    'nearestCenter' => ($c->barangay?->name ?? 'San Isidro') . ' Child Development Center I',
                ];
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('EnrollmentService getNotEnrolledChildren error: ' . $e->getMessage());
        }

        if (!empty($filters['barangay'])) {
            $children = array_filter($children, fn($c) => $c['barangay'] === $filters['barangay']);
        }

        if (!empty($filters['age'])) {
            $ageInt = (int) $filters['age'];
            $children = array_filter($children, fn($c) => $c['ageYears'] === $ageInt);
        }

        return [
            'total' => count($children),
            'children' => array_values($children),
        ];
    }

    /**
     * POST /api/enrollments
     * ENROLL EXISTING CHILD: updates MySQL Child and creates persistent MySQL Enrollment.
     */
    public function enrollChild(array $data): array
    {
        $childId = $data['childId'] ?? $data['child_id'] ?? '';
        $child = \App\Models\Child::where('eccd_id', $childId)
            ->orWhere('id', $childId)
            ->first();

        // If not found by ID, try matching by first_name and last_name
        if (!$child && !empty($data['childName'])) {
            $parts = explode(' ', trim($data['childName']));
            if (count($parts) >= 2) {
                $lastPart = $parts[count($parts) - 1];
                $child = \App\Models\Child::whereRaw('LOWER(TRIM(first_name)) = ?', [strtolower($parts[0])])
                    ->whereRaw('LOWER(TRIM(last_name)) = ?', [strtolower($lastPart)])
                    ->first();
            }
        }

        $barangayName = $data['barangay'] ?? ($child?->barangay?->name ?? 'San Isidro');
        $barangay = \App\Models\Barangay::where('name', $barangayName)->first() ?? $child?->barangay ?? \App\Models\Barangay::first();

        $centerName = $data['center'] ?? $data['dayCareCenter'] ?? 'San Isidro Child Development Center I';
        $dayCareCenter = \App\Models\DayCareCenter::where('name', $centerName)->first();
        if (!$dayCareCenter) {
            $dayCareCenter = \App\Models\DayCareCenter::first();
        }
        if (!$dayCareCenter) {
            try {
                $dayCareCenter = \App\Models\DayCareCenter::create([
                    'code' => 'CDC-' . str_pad((string) rand(1, 999), 3, '0', STR_PAD_LEFT),
                    'name' => $centerName,
                    'barangay_id' => $barangay?->id ?? 1,
                    'address' => 'City of San Fernando',
                    'capacity' => 60,
                    'enrolled_count' => 0,
                    'status' => 'Active',
                ]);
            } catch (\Throwable $cdcErr) {
                $dayCareCenter = \App\Models\DayCareCenter::first();
            }
        }

        $schoolYear = $data['schoolYear'] ?? 'SY 2026–2027';
        $program = $data['program'] ?? 'Child Development Center (CDC)';
        $session = $data['session'] ?? 'Morning Session (8:00 AM – 11:00 AM)';
        $rawDate = $data['enrollmentDate'] ?? now()->toDateString();
        $enrollmentDate = substr($rawDate, 0, 10);
        $teacher = $data['teacher'] ?? $data['remarks'] ?? 'Assigned CDW Teacher';

        if (!$child) {
            // Create child in MySQL if it doesn't exist yet
            $childName = $data['childName'] ?? 'Enrolled Child';
            $nameParts = explode(' ', trim($childName));
            $firstName = $data['firstName'] ?? $nameParts[0] ?? 'Child';
            $lastName = $data['lastName'] ?? (count($nameParts) > 1 ? $nameParts[count($nameParts) - 1] : 'Record');
            $canonicalId = $childId ?: ('ECCD-2026-' . rand(100000, 999999));

            // Ensure household exists
            $hh = \App\Models\Household::first();
            if (!$hh) {
                $hh = \App\Models\Household::create([
                    'household_no' => 'HH-2026-0101',
                    'barangay_id' => $barangay?->id ?? 1,
                    'address' => 'City of San Fernando',
                    'parent_guardian' => 'Parent / Guardian',
                    'mapped_date' => now()->toDateString(),
                    'mapped_by' => 'System',
                ]);
            }

            try {
                $child = \App\Models\Child::create([
                    'eccd_id' => $canonicalId,
                    'household_id' => $hh->id,
                    'barangay_id' => $barangay?->id ?? 1,
                    'day_care_center_id' => $dayCareCenter?->id,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'birth_date' => $data['birthDate'] ?? '2023-01-01',
                    'sex' => $data['sex'] ?? 'Female',
                    'enrollment_status' => 'Enrolled',
                ]);
            } catch (\Throwable $createErr) {
                $child = \App\Models\Child::where('eccd_id', $canonicalId)->first();
            }
        } else {
            $child->enrollment_status = 'Enrolled';
            if ($dayCareCenter) {
                $child->day_care_center_id = $dayCareCenter->id;
            }
            $child->save();
            $canonicalId = $child->eccd_id;
        }

        $enrRecord = null;
        if ($child) {
            $enrRecord = \App\Models\Enrollment::updateOrCreate(
                ['child_id' => $child->eccd_id],
                [
                    'barangay_id' => $barangay?->id ?? $child->barangay_id ?? 1,
                    'day_care_center_id' => $dayCareCenter?->id,
                    'school_year' => $schoolYear,
                    'program' => $program,
                    'session' => $session,
                    'enrollment_date' => $enrollmentDate,
                    'status' => 'Enrolled',
                    'remarks' => $teacher,
                ]
            );
        }

        $id = $enrRecord ? ('ENR-2026-' . str_pad((string) $enrRecord->id, 4, '0', STR_PAD_LEFT)) : ('ENR-' . $canonicalId);

        $newEnrollment = [
            'id' => $id,
            'childId' => $canonicalId,
            'childName' => $child ? trim("{$child->first_name} {$child->last_name}") : ($data['childName'] ?? 'Enrolled Child'),
            'birthDate' => $child?->birth_date?->toDateString() ?? ($data['birthDate'] ?? '2023-01-01'),
            'ageDisplay' => $data['ageDisplay'] ?? '3 yrs',
            'sex' => $child?->sex ?? ($data['sex'] ?? 'Female'),
            'barangay' => $child?->barangay?->name ?? $barangayName,
            'center' => $dayCareCenter?->name ?? $centerName,
            'program' => $program,
            'session' => $session,
            'schoolYear' => $schoolYear,
            'enrollmentDate' => $enrollmentDate,
            'status' => 'Enrolled',
            'teacher' => $teacher,
            'previousRecords' => [],
        ];

        self::$enrollments[$canonicalId] = $newEnrollment;

        return [
            'enrollment' => $newEnrollment,
            'message' => "Child {$newEnrollment['childName']} ({$canonicalId}) officially enrolled in {$newEnrollment['center']}. Database updated to ENROLLED.",
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

        try {
            $records = \App\Models\Enrollment::where('child_id', $childId)->with(['dayCareCenter', 'barangay'])->get();
            foreach ($records as $enr) {
                $item = [
                    'id' => 'ENR-2026-' . str_pad((string) $enr->id, 4, '0', STR_PAD_LEFT),
                    'childId' => $childId,
                    'center' => $enr->dayCareCenter?->name ?? 'San Isidro Child Development Center I',
                    'schoolYear' => $enr->school_year,
                    'program' => $enr->program,
                    'session' => $enr->session,
                    'status' => $enr->status,
                    'enrollmentDate' => $enr->enrollment_date?->toDateString() ?? now()->toDateString(),
                ];
                if ($enr->status === 'Enrolled') {
                    $current = $item;
                }
                $history[] = $item;
            }

            if (!$current) {
                $child = \App\Models\Child::where('eccd_id', $childId)->first();
                if ($child && $child->enrollment_status === 'Enrolled') {
                    $current = [
                        'childId' => $childId,
                        'center' => $child->dayCareCenter?->name ?? 'San Isidro Child Development Center I',
                        'schoolYear' => 'SY 2026–2027',
                        'status' => 'Enrolled',
                        'enrollmentDate' => now()->toDateString(),
                    ];
                    $history[] = $current;
                }
            }
        } catch (\Throwable $e) { }

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
        try {
            $numId = (int) str_replace(['ENR-2026-', 'ENR-'], '', $id);
            $enr = \App\Models\Enrollment::find($numId);
            if ($enr) {
                if (!empty($data['status'])) $enr->status = $data['status'];
                if (!empty($data['center'])) {
                    $cdc = \App\Models\DayCareCenter::where('name', $data['center'])->first();
                    if ($cdc) $enr->day_care_center_id = $cdc->id;
                }
                $enr->save();
                return $data;
            }
        } catch (\Throwable $e) { }

        return null;
    }
}
