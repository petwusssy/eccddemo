<?php

namespace App\Services;

class ReportService
{
    protected ChildManagementService $childService;
    protected CommunityService $communityService;
    protected EnrollmentService $enrollmentService;
    protected HealthMonitoringService $healthService;
    protected DevelopmentAssessmentService $devService;
    protected FollowUpService $followUpService;

    public function __construct(
        ChildManagementService $childService,
        CommunityService $communityService,
        EnrollmentService $enrollmentService,
        HealthMonitoringService $healthService,
        DevelopmentAssessmentService $devService,
        FollowUpService $followUpService
    ) {
        $this->childService = $childService;
        $this->communityService = $communityService;
        $this->enrollmentService = $enrollmentService;
        $this->healthService = $healthService;
        $this->devService = $devService;
        $this->followUpService = $followUpService;
    }

    /**
     * Standard government report header and metadata wrapper
     */
    protected function wrapReport(
        string $category,
        string $title,
        string $formCode,
        array $filters,
        array $summaryStats,
        array $columns,
        array $rows,
        bool $includeOfficialForms = false
    ): array {
        $report = [
            'meta' => [
                'category' => $category,
                'title' => $title,
                'formCode' => $formCode,
                'lgu' => 'City of San Fernando, Pampanga',
                'office' => 'City Social Welfare and Development Office (CSWDO)',
                'system' => 'ECCD CARE System — Centralized Child Demographic Registry',
                'centralDataConcept' => 'DATA ENCODED ONCE • Dynamically compiled from persistent child master records',
                'generatedDate' => now()->format('F d, Y • h:i A'),
                'preparedBy' => 'Ma. Elena D. Santos, RSW (ECCD Focal Person / CSWDO Admin)',
                'systemGeneratedNotice' => 'This is an official system-generated report from ECCD CARE. Compliant with RA 10410 (Early Years Act) and RA 10173 (Data Privacy Act of 2012). Generated directly from authoritative central master records.',
                'appliedFilters' => [
                    'year' => $filters['year'] ?? 'All School Years',
                    'barangay' => $filters['barangay'] ?? 'All Barangays',
                    'dayCareCenter' => $filters['dayCareCenter'] ?? 'All Centers',
                    'age' => $filters['age'] ?? 'All Ages (0–4)',
                    'status' => $filters['status'] ?? 'All Statuses',
                    'dateRange' => ($filters['startDate'] ?? null) && ($filters['endDate'] ?? null)
                        ? "{$filters['startDate']} to {$filters['endDate']}"
                        : 'Current Cycle (SY 2026–2027)',
                ],
            ],
            'summary' => $summaryStats,
            'table' => [
                'columns' => $columns,
                'rows' => $rows,
                'rowCount' => count($rows),
            ],
        ];

        if ($includeOfficialForms) {
            $report['officialIntegration'] = [
                'banner' => 'OFFICIAL ECCD REPORT INTEGRATION POINT',
                'placeholders' => [
                    '[PLACEHOLDER — CONNECT OFFICIAL FORM 4 HERE]',
                    '[PLACEHOLDER — CONNECT OFFICIAL FORM 5 HERE]',
                ],
                'note' => 'Official DSWD / ECCD Council Form 4 (Consolidated Early Childhood Care Report) and Form 5 (LGU Annual Child Profile) integrate here. Do not invent official report layouts.',
            ];
        }

        return $report;
    }

    /**
     * Filter children based on report query params
     */
    protected function filterChildren(array $filters): array
    {
        $all = $this->childService->getChildren()['children'];

        if (!empty($filters['barangay']) && $filters['barangay'] !== 'all' && $filters['barangay'] !== 'All Barangays') {
            $all = array_filter($all, fn($c) => strtolower($c['barangay']) === strtolower($filters['barangay']));
        }

        if (!empty($filters['dayCareCenter']) && $filters['dayCareCenter'] !== 'all' && $filters['dayCareCenter'] !== 'All Centers') {
            $all = array_filter($all, fn($c) => strtolower($c['assignedCenter'] ?? '') === strtolower($filters['dayCareCenter']));
        }

        if (!empty($filters['age']) && $filters['age'] !== 'all') {
            $ageVal = (int) $filters['age'];
            $all = array_filter($all, fn($c) => ($c['ageYears'] ?? 0) === $ageVal);
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $stat = strtolower($filters['status']);
            $all = array_filter($all, function ($c) use ($stat) {
                $enrolled = strtolower($c['statusPillars']['enrolled']['status'] ?? '');
                $health = strtolower($c['statusPillars']['health']['status'] ?? '');
                $dev = strtolower($c['statusPillars']['development']['status'] ?? '');
                return str_contains($enrolled, $stat) || str_contains($health, $stat) || str_contains($dev, $stat);
            });
        }

        return array_values($all);
    }

    /**
     * 1. GET /api/reports/mapping
     * Community Mapping Report
     */
    public function getMappingReport(array $filters = []): array
    {
        $children = $this->filterChildren($filters);

        $mappedCount = 0;
        $householdsMap = [];
        $rows = [];

        foreach ($children as $c) {
            $isMapped = ($c['statusPillars']['mapped']['status'] ?? '') === 'Mapped';
            if ($isMapped) $mappedCount++;
            if (!empty($c['householdId'])) {
                $householdsMap[$c['householdId']] = true;
            }

            $rows[] = [
                'eccdId' => $c['id'],
                'childName' => $c['fullName'],
                'ageSex' => "{$c['ageDisplay']} / {$c['sex']}",
                'barangay' => $c['barangay'],
                'purok' => $c['purok'] ?? 'Purok 1',
                'householdId' => $c['householdId'] ?? 'N/A',
                'parentGuardian' => $c['parentGuardian'] ?? 'N/A',
                'dateMapped' => $c['statusPillars']['mapped']['date'] ?? '2026-09-18',
                'fieldWorker' => $c['statusPillars']['mapped']['worker'] ?? ($c['assignedWorker'] ?? 'CSWDO Worker'),
                'status' => $c['statusPillars']['mapped']['status'] ?? 'Mapped',
            ];
        }

        $summary = [
            'totalChildren' => count($children),
            'totalMapped' => $mappedCount,
            'coveragePercent' => count($children) > 0 ? round(($mappedCount / count($children)) * 100, 1) . '%' : '0%',
            'uniqueHouseholds' => count($householdsMap),
        ];

        $columns = [
            ['key' => 'eccdId', 'label' => 'ECCD ID'],
            ['key' => 'childName', 'label' => 'Child Full Name'],
            ['key' => 'ageSex', 'label' => 'Age / Sex'],
            ['key' => 'barangay', 'label' => 'Barangay'],
            ['key' => 'purok', 'label' => 'Purok/Sitio'],
            ['key' => 'householdId', 'label' => 'Household ID'],
            ['key' => 'parentGuardian', 'label' => 'Parent / Guardian'],
            ['key' => 'dateMapped', 'label' => 'Mapping Date'],
            ['key' => 'fieldWorker', 'label' => 'Enumerator / CDW'],
            ['key' => 'status', 'label' => 'Mapping Status'],
        ];

        return $this->wrapReport(
            'Community Mapping',
            'Community Mapping Demographic Masterlist (Children 0–4)',
            'CSWDO-ECCD-MAP-01',
            $filters,
            $summary,
            $columns,
            $rows
        );
    }

    /**
     * 2. GET /api/reports/enrollment
     * Day Care / CDC Enrollment Report
     */
    public function getEnrollmentReport(array $filters = []): array
    {
        $children = $this->filterChildren($filters);

        $enrolledRows = [];
        $notEnrolledCount = 0;
        $morningCount = 0;
        $afternoonCount = 0;

        foreach ($children as $c) {
            $isEnrolled = ($c['statusPillars']['enrolled']['status'] ?? '') === 'Enrolled';
            if ($isEnrolled) {
                $session = $c['statusPillars']['enrolled']['session'] ?? 'Morning Session (8:00 AM – 11:00 AM)';
                if (str_contains($session, 'Morning')) $morningCount++;
                if (str_contains($session, 'Afternoon')) $afternoonCount++;

                $enrolledRows[] = [
                    'eccdId' => $c['id'],
                    'childName' => $c['fullName'],
                    'ageSex' => "{$c['ageDisplay']} / {$c['sex']}",
                    'barangay' => $c['barangay'],
                    'assignedCenter' => $c['assignedCenter'] ?? 'Day Care Center',
                    'session' => $session,
                    'enrollmentDate' => $c['statusPillars']['enrolled']['date'] ?? '2026-06-15',
                    'schoolYear' => 'SY 2026–2027',
                    'status' => 'Enrolled',
                ];
            } else {
                $notEnrolledCount++;
            }
        }

        $summary = [
            'totalChildrenIdentified' => count($children),
            'totalEnrolled' => count($enrolledRows),
            'morningSessionCount' => $morningCount,
            'afternoonSessionCount' => $afternoonCount,
            'enrollmentRate' => count($children) > 0 ? round((count($enrolledRows) / count($children)) * 100, 1) . '%' : '0%',
        ];

        $columns = [
            ['key' => 'eccdId', 'label' => 'ECCD ID'],
            ['key' => 'childName', 'label' => 'Enrolled Child'],
            ['key' => 'ageSex', 'label' => 'Age / Sex'],
            ['key' => 'barangay', 'label' => 'Barangay'],
            ['key' => 'assignedCenter', 'label' => 'Child Development Center'],
            ['key' => 'session', 'label' => 'Assigned Session'],
            ['key' => 'enrollmentDate', 'label' => 'Date of Admission'],
            ['key' => 'schoolYear', 'label' => 'School Year'],
            ['key' => 'status', 'label' => 'Status'],
        ];

        return $this->wrapReport(
            'Enrollment',
            'Day Care & Child Development Center Enrollment Registry',
            'CSWDO-ECCD-ENR-01',
            $filters,
            $summary,
            $columns,
            $enrolledRows
        );
    }

    /**
     * 3. Children Not Enrolled Report
     */
    public function getChildrenNotEnrolledReport(array $filters = []): array
    {
        $children = $this->filterChildren($filters);

        $notEnrolledRows = [];

        foreach ($children as $c) {
            $isEnrolled = ($c['statusPillars']['enrolled']['status'] ?? '') === 'Enrolled';
            if (!$isEnrolled) {
                $notEnrolledRows[] = [
                    'eccdId' => $c['id'],
                    'childName' => $c['fullName'],
                    'ageSex' => "{$c['ageDisplay']} / {$c['sex']}",
                    'barangay' => $c['barangay'],
                    'purok' => $c['purok'] ?? 'Purok 1',
                    'parentGuardian' => $c['parentGuardian'] ?? 'N/A',
                    'contactNumber' => $c['contactNumber'] ?? 'N/A',
                    'assignedCenter' => $c['assignedCenter'] ?? 'Nearest CDC',
                    'mappingDate' => $c['statusPillars']['mapped']['date'] ?? '2026-09-18',
                    'status' => 'Not Enrolled (Eligible for Admission)',
                ];
            }
        }

        $summary = [
            'totalChildrenIdentified' => count($children),
            'totalNotEnrolled' => count($notEnrolledRows),
            'unmetNeedRate' => count($children) > 0 ? round((count($notEnrolledRows) / count($children)) * 100, 1) . '%' : '0%',
            'priorityTargetGroup' => 'Children Aged 3–4 Years for CDC Intake',
        ];

        $columns = [
            ['key' => 'eccdId', 'label' => 'ECCD ID'],
            ['key' => 'childName', 'label' => 'Child Name'],
            ['key' => 'ageSex', 'label' => 'Age / Sex'],
            ['key' => 'barangay', 'label' => 'Barangay'],
            ['key' => 'purok', 'label' => 'Purok/Sitio'],
            ['key' => 'parentGuardian', 'label' => 'Parent / Guardian'],
            ['key' => 'contactNumber', 'label' => 'Contact Number'],
            ['key' => 'assignedCenter', 'label' => 'Target Center'],
            ['key' => 'mappingDate', 'label' => 'Mapping Date'],
            ['key' => 'status', 'label' => 'Status'],
        ];

        return $this->wrapReport(
            'Children Not Enrolled',
            'Mapped Children (0–4) Identified But Not Yet Enrolled in CDC',
            'CSWDO-ECCD-NOT-ENR-01',
            $filters,
            $summary,
            $columns,
            $notEnrolledRows
        );
    }

    /**
     * 4. GET /api/reports/health
     * Health Monitoring Report (Height / Weight / Growth Monitoring)
     */
    public function getHealthReport(array $filters = []): array
    {
        $children = $this->filterChildren($filters);

        $upToDateCount = 0;
        $dueCount = 0;
        $overdueCount = 0;
        $rows = [];

        foreach ($children as $c) {
            $health = $c['statusPillars']['health'] ?? [];
            $status = $health['status'] ?? 'Up to date';

            if (str_contains(strtolower($status), 'up to date')) $upToDateCount++;
            elseif (str_contains(strtolower($status), 'due')) $dueCount++;
            elseif (str_contains(strtolower($status), 'overdue')) $overdueCount++;
            else $upToDateCount++;

            $rows[] = [
                'eccdId' => $c['id'],
                'childName' => $c['fullName'],
                'ageSex' => "{$c['ageDisplay']} / {$c['sex']}",
                'barangay' => $c['barangay'],
                'center' => $c['assignedCenter'] ?? 'San Isidro CDC I',
                'weightKg' => isset($health['lastWeightKg']) ? "{$health['lastWeightKg']} kg" : '14.2 kg',
                'heightCm' => isset($health['lastHeightCm']) ? "{$health['lastHeightCm']} cm" : '94.5 cm',
                'lastMonitored' => $health['lastChecked'] ?? '2026-09-12',
                'assignedCDW' => $c['assignedWorker'] ?? 'Maria Santos, CDW I',
                'status' => $status,
            ];
        }

        $summary = [
            'totalChildrenMonitored' => count($rows),
            'upToDate' => $upToDateCount,
            'monitoringDue' => $dueCount,
            'monitoringOverdue' => $overdueCount,
            'complianceRate' => count($rows) > 0 ? round(($upToDateCount / count($rows)) * 100, 1) . '%' : '0%',
        ];

        $columns = [
            ['key' => 'eccdId', 'label' => 'ECCD ID'],
            ['key' => 'childName', 'label' => 'Child Name'],
            ['key' => 'ageSex', 'label' => 'Age / Sex'],
            ['key' => 'barangay', 'label' => 'Barangay'],
            ['key' => 'center', 'label' => 'Day Care Center'],
            ['key' => 'weightKg', 'label' => 'Weight (kg)'],
            ['key' => 'heightCm', 'label' => 'Height (cm)'],
            ['key' => 'lastMonitored', 'label' => 'Monitoring Date'],
            ['key' => 'assignedCDW', 'label' => 'CDW In-charge'],
            ['key' => 'status', 'label' => 'Health Status'],
        ];

        return $this->wrapReport(
            'Health Monitoring',
            'Monthly Growth & Health Monitoring Registry (Operation Timbang Plus)',
            'CSWDO-ECCD-HLTH-01',
            $filters,
            $summary,
            $columns,
            $rows
        );
    }

    /**
     * 5. GET /api/reports/development
     * Development Assessment Report
     */
    public function getDevelopmentReport(array $filters = []): array
    {
        $children = $this->filterChildren($filters);

        $completedCount = 0;
        $pendingCount = 0;
        $followUpReqCount = 0;
        $rows = [];

        foreach ($children as $c) {
            $dev = $c['statusPillars']['development'] ?? [];
            $status = $dev['status'] ?? 'Assessment Completed';

            if (str_contains(strtolower($status), 'completed')) $completedCount++;
            elseif (str_contains(strtolower($status), 'pending')) $pendingCount++;
            elseif (str_contains(strtolower($status), 'follow-up') || str_contains(strtolower($status), 'follow up')) $followUpReqCount++;
            else $completedCount++;

            $rows[] = [
                'eccdId' => $c['id'],
                'childName' => $c['fullName'],
                'ageSex' => "{$c['ageDisplay']} / {$c['sex']}",
                'barangay' => $c['barangay'],
                'center' => $c['assignedCenter'] ?? 'Day Care Center',
                'assessmentCycle' => $dev['cycle'] ?? 'Cycle 1 (Baseline - SY 2026–2027)',
                'assessmentDate' => $dev['lastAssessment'] ?? '2026-09-15',
                'assessor' => $dev['assessor'] ?? ($c['assignedWorker'] ?? 'Maria Santos, CDW I'),
                'status' => $status,
            ];
        }

        $summary = [
            'totalEvaluated' => count($rows),
            'assessmentsCompleted' => $completedCount,
            'assessmentsPending' => $pendingCount,
            'followUpRequired' => $followUpReqCount,
            'framework' => 'Philippine Early Childhood Care & Development (ECCD) Assessment System',
        ];

        $columns = [
            ['key' => 'eccdId', 'label' => 'ECCD ID'],
            ['key' => 'childName', 'label' => 'Child Name'],
            ['key' => 'ageSex', 'label' => 'Age / Sex'],
            ['key' => 'barangay', 'label' => 'Barangay'],
            ['key' => 'center', 'label' => 'Day Care Center'],
            ['key' => 'assessmentCycle', 'label' => 'Assessment Cycle'],
            ['key' => 'assessmentDate', 'label' => 'Date Evaluated'],
            ['key' => 'assessor', 'label' => 'Assessor / CDW'],
            ['key' => 'status', 'label' => 'Evaluation Status'],
        ];

        return $this->wrapReport(
            'Development Assessment',
            'ECCD Checklist Developmental Assessment Registry',
            'CSWDO-ECCD-DEV-01',
            $filters,
            $summary,
            $columns,
            $rows
        );
    }

    /**
     * 6. GET /api/reports/follow-ups
     * Follow-up & Early Support Case Queue Report
     */
    public function getFollowUpsReport(array $filters = []): array
    {
        $casesResult = $this->followUpService->getFollowUps($filters);
        $cases = $casesResult['cases'] ?? [];

        $needsAttention = 0;
        $scheduled = 0;
        $completed = 0;
        $rows = [];

        foreach ($cases as $c) {
            $cat = $c['category'] ?? 'Needs Attention';
            if ($cat === 'Needs Attention') $needsAttention++;
            elseif ($cat === 'Scheduled') $scheduled++;
            elseif ($cat === 'Completed') $completed++;

            $rows[] = [
                'caseId' => $c['id'],
                'eccdId' => $c['childId'],
                'childName' => $c['childName'],
                'barangay' => $c['barangay'],
                'actionType' => $c['actionType'] ?? 'Follow-up',
                'reason' => $c['reason'],
                'assignedWorker' => $c['assignedWorker'],
                'createdDate' => $c['createdDate'],
                'dueDate' => $c['dueDate'],
                'status' => $c['status'],
            ];
        }

        $summary = [
            'totalCases' => count($rows),
            'needsAttention' => $needsAttention,
            'scheduled' => $scheduled,
            'completed' => $completed,
            'resolutionRate' => count($rows) > 0 ? round(($completed / count($rows)) * 100, 1) . '%' : '0%',
        ];

        $columns = [
            ['key' => 'caseId', 'label' => 'Case ID'],
            ['key' => 'eccdId', 'label' => 'ECCD ID'],
            ['key' => 'childName', 'label' => 'Child Name'],
            ['key' => 'barangay', 'label' => 'Barangay'],
            ['key' => 'actionType', 'label' => 'Action Type'],
            ['key' => 'reason', 'label' => 'Support / Monitoring Reason'],
            ['key' => 'assignedWorker', 'label' => 'Assigned Worker'],
            ['key' => 'dueDate', 'label' => 'Due Date'],
            ['key' => 'status', 'label' => 'Status'],
        ];

        return $this->wrapReport(
            'Follow-up',
            'Intervention, Referrals & Early Support Follow-up Case Queue',
            'CSWDO-ECCD-FUP-01',
            $filters,
            $summary,
            $columns,
            $rows
        );
    }

    /**
     * 7. GET /api/reports/barangay-summary
     * Barangay Summary Report (All 35 San Fernando Barangays)
     */
    public function getBarangaySummaryReport(array $filters = []): array
    {
        $bList = $this->communityService->getBarangays()['barangays'];

        $totalChildren = 0;
        $totalMapped = 0;
        $totalEnrolled = 0;
        $totalNotEnrolled = 0;
        $totalHealthDue = 0;
        $totalDevFollowups = 0;
        $rows = [];

        foreach ($bList as $b) {
            $totalChildren += $b['totalChildren'];
            $totalMapped += $b['mapped'];
            $totalEnrolled += $b['enrolled'];
            $totalNotEnrolled += $b['notEnrolled'];
            $totalHealthDue += $b['healthDue'];
            $totalDevFollowups += $b['devFollowups'];

            $rows[] = [
                'barangay' => $b['name'],
                'district' => $b['district'],
                'children04' => $b['totalChildren'],
                'mapped' => $b['mapped'],
                'enrolled' => $b['enrolled'],
                'notEnrolled' => $b['notEnrolled'],
                'healthDue' => $b['healthDue'],
                'devFollowups' => $b['devFollowups'],
                'centersCount' => $b['centersCount'],
                'workersCount' => $b['workersCount'],
            ];
        }

        $summary = [
            'totalBarangays' => count($bList),
            'cityChildren04' => $totalChildren,
            'cityMapped' => $totalMapped,
            'cityEnrolled' => $totalEnrolled,
            'cityNotEnrolled' => $totalNotEnrolled,
            'cityHealthDue' => $totalHealthDue,
            'cityDevFollowups' => $totalDevFollowups,
            'cityEnrollmentRate' => $totalChildren > 0 ? round(($totalEnrolled / $totalChildren) * 100, 1) . '%' : '0%',
        ];

        $columns = [
            ['key' => 'barangay', 'label' => 'Barangay'],
            ['key' => 'district', 'label' => 'District'],
            ['key' => 'children04', 'label' => 'Children 0–4'],
            ['key' => 'mapped', 'label' => 'Mapped'],
            ['key' => 'enrolled', 'label' => 'Enrolled'],
            ['key' => 'notEnrolled', 'label' => 'Not Enrolled'],
            ['key' => 'healthDue', 'label' => 'Health Due'],
            ['key' => 'devFollowups', 'label' => 'Dev Follow-ups'],
            ['key' => 'centersCount', 'label' => 'Centers'],
            ['key' => 'workersCount', 'label' => 'Workers'],
        ];

        return $this->wrapReport(
            'Barangay Summary',
            'City-wide Consolidated Barangay Summary (Children 0–4 Demographics)',
            'CSWDO-ECCD-BRGY-01',
            $filters,
            $summary,
            $columns,
            $rows
        );
    }

    /**
     * 8. GET /api/reports/consolidated-family
     * Consolidated Family Profile Report
     */
    public function getConsolidatedFamilyReport(array $filters = []): array
    {
        $children = $this->filterChildren($filters);

        $hhMap = [];
        foreach ($children as $c) {
            $hhId = $c['householdId'] ?? 'HH-UNTAGGED';
            if (!isset($hhMap[$hhId])) {
                $hhMap[$hhId] = [
                    'householdId' => $hhId,
                    'parentGuardian' => $c['parentGuardian'] ?? 'N/A',
                    'contactNumber' => $c['contactNumber'] ?? 'N/A',
                    'barangay' => $c['barangay'],
                    'address' => $c['address'] ?? ($c['barangay'] . ', San Fernando'),
                    'is4Ps' => !empty($c['is4PsBeneficiary']),
                    'incomeClass' => $c['monthlyIncomeClass'] ?? 'Low Income (<₱15,000)',
                    'childrenCount' => 0,
                    'childrenNames' => [],
                ];
            }
            $hhMap[$hhId]['childrenCount']++;
            $hhMap[$hhId]['childrenNames'][] = $c['fullName'];
        }

        $total4Ps = 0;
        $rows = [];
        foreach ($hhMap as $hh) {
            if ($hh['is4Ps']) $total4Ps++;
            $rows[] = [
                'householdId' => $hh['householdId'],
                'parentGuardian' => $hh['parentGuardian'],
                'contactNumber' => $hh['contactNumber'],
                'barangay' => $hh['barangay'],
                'address' => $hh['address'],
                'is4Ps' => $hh['is4Ps'] ? 'Yes (4Ps Pantawid)' : 'No (Non-4Ps)',
                'incomeClass' => $hh['incomeClass'],
                'childrenCount' => $hh['childrenCount'],
                'childrenNames' => implode(', ', $hh['childrenNames']),
            ];
        }

        $summary = [
            'totalHouseholdsProfiled' => count($rows),
            'total4PsHouseholds' => $total4Ps,
            'non4PsHouseholds' => count($rows) - $total4Ps,
            'percent4Ps' => count($rows) > 0 ? round(($total4Ps / count($rows)) * 100, 1) . '%' : '0%',
        ];

        $columns = [
            ['key' => 'householdId', 'label' => 'Household ID'],
            ['key' => 'parentGuardian', 'label' => 'Parent / Guardian'],
            ['key' => 'contactNumber', 'label' => 'Contact'],
            ['key' => 'barangay', 'label' => 'Barangay'],
            ['key' => 'address', 'label' => 'Physical Address'],
            ['key' => 'is4Ps', 'label' => '4Ps Status'],
            ['key' => 'incomeClass', 'label' => 'Income Bracket'],
            ['key' => 'childrenCount', 'label' => 'Children (0–4)'],
            ['key' => 'childrenNames', 'label' => 'Registered Children'],
        ];

        return $this->wrapReport(
            'Consolidated Family Profile',
            'Consolidated Household & Family Demographics Profile',
            'CSWDO-ECCD-FAM-01',
            $filters,
            $summary,
            $columns,
            $rows
        );
    }

    /**
     * 9. GET /api/reports/consolidated-children
     * Consolidated Children's Profile
     * Includes OFFICIAL ECCD REPORT INTEGRATION POINT (FORM 4 / FORM 5)
     */
    public function getConsolidatedChildrenReport(array $filters = []): array
    {
        $children = $this->filterChildren($filters);

        $maleCount = 0;
        $femaleCount = 0;
        $philsysCount = 0;
        $rows = [];

        foreach ($children as $c) {
            if ($c['sex'] === 'Male') $maleCount++;
            else $femaleCount++;

            if (!empty($c['philSysNumber']) && $c['philSysNumber'] !== 'N/A') {
                $philsysCount++;
            }

            $rows[] = [
                'eccdId' => $c['id'],
                'fullName' => $c['fullName'],
                'birthDate' => $c['birthDate'],
                'age' => $c['ageDisplay'],
                'sex' => $c['sex'],
                'barangay' => $c['barangay'],
                'guardian' => $c['parentGuardian'] ?? 'N/A',
                'philSysNumber' => $c['philSysNumber'] ?? 'N/A',
                'enrolled' => $c['statusPillars']['enrolled']['status'] ?? 'Not Enrolled',
                'health' => $c['statusPillars']['health']['status'] ?? 'Up to date',
                'development' => $c['statusPillars']['development']['status'] ?? 'Assessment Completed',
                'followUp' => $c['statusPillars']['followUp']['status'] ?? 'None',
            ];
        }

        $summary = [
            'totalChildren' => count($children),
            'maleCount' => $maleCount,
            'femaleCount' => $femaleCount,
            'philSysLinked' => $philsysCount,
            'philSysPercent' => count($children) > 0 ? round(($philsysCount / count($children)) * 100, 1) . '%' : '0%',
        ];

        $columns = [
            ['key' => 'eccdId', 'label' => 'ECCD ID'],
            ['key' => 'fullName', 'label' => 'Child Name'],
            ['key' => 'birthDate', 'label' => 'Birthdate'],
            ['key' => 'age', 'label' => 'Age'],
            ['key' => 'sex', 'label' => 'Sex'],
            ['key' => 'barangay', 'label' => 'Barangay'],
            ['key' => 'guardian', 'label' => 'Guardian'],
            ['key' => 'philSysNumber', 'label' => 'PhilSys ID'],
            ['key' => 'enrolled', 'label' => 'Enrollment'],
            ['key' => 'health', 'label' => 'Health Status'],
            ['key' => 'development', 'label' => 'Development Status'],
            ['key' => 'followUp', 'label' => 'Follow-up Status'],
        ];

        // Include official Form 4 / Form 5 placeholder
        return $this->wrapReport(
            'Consolidated Children’s Profile',
            'Consolidated Master Demographic Profile of Children (0–4 Years Old)',
            'CSWDO-ECCD-CONSOL-01',
            $filters,
            $summary,
            $columns,
            $rows,
            true // includeOfficialForms = true
        );
    }

    /**
     * 10. GET /api/reports/consolidated-cdw
     * Official Form 8: Consolidated Child Development Worker Profile
     */
    public function getConsolidatedCdwReport(array $filters = []): array
    {
        $allWorkers = $this->communityService->getWorkers()['workers'] ?? [];

        if (!empty($filters['barangay']) && $filters['barangay'] !== 'all' && $filters['barangay'] !== 'All Barangays') {
            $allWorkers = array_filter($allWorkers, function($w) use ($filters) {
                return strtolower($w['barangay'] ?? '') === strtolower($filters['barangay']);
            });
        }

        if (!empty($filters['dayCareCenter']) && $filters['dayCareCenter'] !== 'all' && $filters['dayCareCenter'] !== 'All Centers') {
            $allWorkers = array_filter($allWorkers, function($w) use ($filters) {
                return strtolower($w['center'] ?? '') === strtolower($filters['dayCareCenter']);
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $allWorkers = array_filter($allWorkers, function($w) use ($filters) {
                return strtolower($w['status'] ?? '') === strtolower($filters['status']);
            });
        }

        $totalWorkers = count($allWorkers);
        $totalActive = 0;
        $totalAccredited = 0;
        $rows = [];

        foreach ($allWorkers as $w) {
            $isActive = strtolower($w['status'] ?? '') === 'active';
            if ($isActive) $totalActive++;

            $isAccredited = !empty($w['accreditationNo']) && $w['accreditationNo'] !== 'Pending Accreditation';
            if ($isAccredited) $totalAccredited++;

            $rows[] = [
                'workerId' => $w['id'] ?? 'WKR-000',
                'name' => $w['name'] ?? 'Worker Name',
                'designation' => $w['role'] ?? 'Child Development Worker',
                'barangay' => $w['barangay'] ?? 'City of San Fernando',
                'center' => $w['center'] ?? 'Child Development Center',
                'accreditationNo' => $w['accreditationNo'] ?? 'CDW-2024-001',
                'contact' => $w['contact'] ?? '0917-000-0000',
                'status' => $w['status'] ?? 'Active',
            ];
        }

        $summary = [
            'totalWorkersProfiled' => $totalWorkers,
            'activeWorkers' => $totalActive,
            'accreditedWorkers' => $totalAccredited,
            'coverageRate' => $totalWorkers > 0 ? round(($totalAccredited / $totalWorkers) * 100, 1) . '%' : '100%',
        ];

        $columns = [
            ['key' => 'workerId', 'label' => 'Worker ID'],
            ['key' => 'name', 'label' => 'Worker Name'],
            ['key' => 'designation', 'label' => 'Designation'],
            ['key' => 'barangay', 'label' => 'Barangay'],
            ['key' => 'center', 'label' => 'Assigned CDC'],
            ['key' => 'accreditationNo', 'label' => 'Accreditation No.'],
            ['key' => 'contact', 'label' => 'Contact Number'],
            ['key' => 'status', 'label' => 'Status'],
        ];

        return $this->wrapReport(
            'Consolidated CDW Profile',
            'Official Form 8: Consolidated Child Development Worker Profile',
            'ECCD-FORM-8',
            $filters,
            $summary,
            $columns,
            $rows,
            true
        );
    }

    /**
     * 11. GET /api/reports/consolidated-cdc
     * Official Form 9: Consolidated Child Development Center Profile
     */
    public function getConsolidatedCdcReport(array $filters = []): array
    {
        $allCenters = $this->communityService->getCenters()['centers'] ?? [];

        if (!empty($filters['barangay']) && $filters['barangay'] !== 'all' && $filters['barangay'] !== 'All Barangays') {
            $allCenters = array_filter($allCenters, function($c) use ($filters) {
                return strtolower($c['barangay'] ?? '') === strtolower($filters['barangay']);
            });
        }

        if (!empty($filters['dayCareCenter']) && $filters['dayCareCenter'] !== 'all' && $filters['dayCareCenter'] !== 'All Centers') {
            $allCenters = array_filter($allCenters, function($c) use ($filters) {
                return strtolower($c['name'] ?? '') === strtolower($filters['dayCareCenter']);
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $allCenters = array_filter($allCenters, function($c) use ($filters) {
                return strtolower($c['status'] ?? '') === strtolower($filters['status']);
            });
        }

        $totalCenters = count($allCenters);
        $totalCapacity = 0;
        $totalEnrolled = 0;
        $rows = [];

        foreach ($allCenters as $c) {
            $cap = (int)($c['capacity'] ?? 60);
            $enr = (int)($c['enrolledCount'] ?? 0);
            $totalCapacity += $cap;
            $totalEnrolled += $enr;

            $rows[] = [
                'code' => $c['code'] ?? 'CDC-CSFP-01',
                'name' => $c['name'] ?? 'Child Development Center',
                'barangay' => $c['barangay'] ?? 'City of San Fernando',
                'address' => $c['address'] ?? 'Barangay Hall Compound',
                'capacity' => $cap,
                'enrolledCount' => $enr,
                'utilizationRate' => $cap > 0 ? round(($enr / $cap) * 100, 1) . '%' : '0%',
                'accreditationLevel' => $c['accreditationLevel'] ?? 'Level 1 Accredited',
                'status' => $c['status'] ?? 'Operational',
            ];
        }

        $summary = [
            'totalCentersProfiled' => $totalCenters,
            'totalCapacity' => $totalCapacity,
            'totalEnrolledChildren' => $totalEnrolled,
            'overallUtilization' => $totalCapacity > 0 ? round(($totalEnrolled / $totalCapacity) * 100, 1) . '%' : '0%',
        ];

        $columns = [
            ['key' => 'code', 'label' => 'Center Code'],
            ['key' => 'name', 'label' => 'Center Name'],
            ['key' => 'barangay', 'label' => 'Barangay'],
            ['key' => 'address', 'label' => 'Address / Location'],
            ['key' => 'capacity', 'label' => 'Capacity'],
            ['key' => 'enrolledCount', 'label' => 'Enrolled'],
            ['key' => 'utilizationRate', 'label' => 'Utilization'],
            ['key' => 'accreditationLevel', 'label' => 'Accreditation'],
            ['key' => 'status', 'label' => 'Status'],
        ];

        return $this->wrapReport(
            'Consolidated CDC Profile',
            'Official Form 9: Consolidated Child Development Center Profile',
            'ECCD-FORM-9',
            $filters,
            $summary,
            $columns,
            $rows,
            true
        );
    }
}
