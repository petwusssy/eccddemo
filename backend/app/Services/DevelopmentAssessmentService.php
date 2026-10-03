<?php

namespace App\Services;

class DevelopmentAssessmentService
{
    /**
     * In-memory store for development assessments keyed by Child ECCD ID.
     * Framework designed with explicit placeholders for official ECCD Checklist integration.
     * Neutral prototype states only: Assessment Pending, Assessment Completed, Follow-up Required.
     * NO medical or developmental diagnoses.
     */
    protected static array $assessments = [];

    /**
     * Directory of assessment cohort children.
     */
    protected static array $assessmentCohort = [];

    /**
     * GET /api/development/assessments
     * Returns dashboard KPI counts and list of children with assessment status.
     */
    public function getAssessments(array $filters = []): array
    {
        $cohort = self::$assessmentCohort;

        // KPI Counts
        $counts = [
            'completedAssessments' => 0,
            'pendingAssessments' => 0,
            'followUps' => 0,
            'dueAssessments' => 0,
            'totalCohort' => count($cohort),
        ];

        foreach ($cohort as $c) {
            if ($c['status'] === 'Assessment Completed') {
                $counts['completedAssessments']++;
            } elseif ($c['status'] === 'Assessment Pending') {
                $counts['pendingAssessments']++;
                $counts['dueAssessments']++;
            } elseif ($c['status'] === 'Follow-up Required') {
                $counts['followUps']++;
            }
        }

        // Apply filters
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $st = strtolower($filters['status']);
            $cohort = array_filter($cohort, fn($c) => strtolower($c['status']) === $st);
        }

        if (!empty($filters['barangay']) && $filters['barangay'] !== 'all') {
            $brgy = $filters['barangay'];
            $cohort = array_filter($cohort, fn($c) => $c['barangay'] === $brgy);
        }

        if (!empty($filters['dayCareCenter']) && $filters['dayCareCenter'] !== 'all') {
            $center = $filters['dayCareCenter'];
            $cohort = array_filter($cohort, fn($c) => $c['dayCareCenter'] === $center);
        }

        if (!empty($filters['search'])) {
            $q = strtolower(trim($filters['search']));
            $cohort = array_filter($cohort, function ($c) use ($q) {
                return str_contains(strtolower($c['fullName']), $q)
                    || str_contains(strtolower($c['childId']), $q)
                    || str_contains(strtolower($c['barangay']), $q);
            });
        }

        return [
            'counts' => $counts,
            'total' => count($cohort),
            'children' => array_values($cohort),
        ];
    }

    /**
     * GET /api/children/{id}/development
     * Returns chronological assessment history and integration point placeholders for the child.
     */
    public function getChildDevelopment(string $childId): ?array
    {
        $records = self::$assessments[$childId] ?? [];

        // Sort descending by date
        usort($records, fn($a, $b) => strcmp($b['assessmentDate'], $a['assessmentDate']));

        $profile = null;
        foreach (self::$assessmentCohort as $c) {
            if ($c['childId'] === $childId) {
                $profile = $c;
                break;
            }
        }

        $latest = $records[0] ?? null;
        $status = $latest ? $latest['status'] : ($profile['status'] ?? 'Assessment Pending');

        return [
            'childId' => $childId,
            'childName' => $profile['fullName'] ?? 'Child ' . $childId,
            'barangay' => $profile['barangay'] ?? '',
            'dayCareCenter' => $profile['dayCareCenter'] ?? '',
            'status' => $status,
            'latestAssessment' => $latest,
            'history' => $records,
            'integrationPlaceholders' => [
                'checklistBanner' => 'OFFICIAL ECCD CHECKLIST INTEGRATION POINT',
                'record1Placeholder' => '[PLACEHOLDER — CONNECT OFFICIAL ECCD CHECKLIST CHILD’S RECORD 1 HERE]',
                'record2Placeholder' => '[PLACEHOLDER — CONNECT OFFICIAL ECCD CHECKLIST CHILD’S RECORD 2 HERE]',
                'scoringBanner' => 'OFFICIAL SCORING INTEGRATION POINT',
                'scoringPlaceholder' => '[PLACEHOLDER — CONNECT OFFICIAL SCALED SCORE / STANDARD SCORE REFERENCE HERE]',
            ],
        ];
    }

    /**
     * POST /api/children/{id}/development
     * Records assessment metadata and updates Child 360° Profile & follow-up queue if required.
     */
    public function recordAssessment(string $childId, array $data, ?ChildManagementService $childService = null): array
    {
        $newId = 'DEV-REC-' . str_pad((string) rand(100, 999), 3, '0', STR_PAD_LEFT);
        $date = $data['assessmentDate'] ?? $data['date'] ?? now()->toDateString();
        $assessor = trim($data['assessor'] ?? 'CSWDO Assessor');
        $status = $data['status'] ?? 'Assessment Completed';
        $notes = trim($data['notes'] ?? '');
        $cycle = $data['assessmentCycle'] ?? 'Cycle 1 (Baseline - SY 2026–2027)';

        // Ensure status is strictly one of the 3 neutral prototype states
        $allowedStatuses = ['Assessment Pending', 'Assessment Completed', 'Follow-up Required'];
        if (!in_array($status, $allowedStatuses, true)) {
            $status = 'Assessment Completed';
        }

        $newRecord = [
            'id' => $newId,
            'childId' => $childId,
            'childName' => $data['childName'] ?? 'Enrolled Child',
            'barangay' => $data['barangay'] ?? 'San Isidro',
            'dayCareCenter' => $data['dayCareCenter'] ?? 'Day Care Center',
            'assessmentCycle' => $cycle,
            'assessmentDate' => $date,
            'assessor' => $assessor,
            'status' => $status,
            'notes' => $notes,
            'checklistFramework' => 'Official ECCD Checklist Integration Point Placeholder',
            'scoringReference' => 'Official Scoring Integration Point Placeholder',
            'createdAt' => now()->toIso8601String(),
        ];

        if (!isset(self::$assessments[$childId])) {
            self::$assessments[$childId] = [];
        }
        array_unshift(self::$assessments[$childId], $newRecord);

        // Update cohort directory cache
        $found = false;
        foreach (self::$assessmentCohort as &$child) {
            if ($child['childId'] === $childId) {
                $child['lastAssessmentDate'] = $date;
                $child['status'] = $status;
                $child['cycle'] = $cycle;
                $child['assessor'] = $assessor;
                $found = true;
                break;
            }
        }

        if (!$found) {
            self::$assessmentCohort[] = [
                'childId' => $childId,
                'fullName' => $data['childName'] ?? 'Enrolled Child',
                'sex' => $data['sex'] ?? 'Unknown',
                'ageDisplay' => $data['ageDisplay'] ?? '3 yrs',
                'barangay' => $data['barangay'] ?? 'San Isidro',
                'dayCareCenter' => $data['dayCareCenter'] ?? 'Day Care Center',
                'lastAssessmentDate' => $date,
                'status' => $status,
                'cycle' => $cycle,
                'assessor' => $assessor,
            ];
        }

        // Child 360° Profile Integration
        if ($childService) {
            $variant = $status === 'Assessment Completed' ? 'success' : ($status === 'Follow-up Required' ? 'warning' : 'neutral');

            // 1. Update Development status pillar
            $childService->updateChild($childId, [
                'statusPillars' => array_merge(
                    $childService->getStatusPillars($childId) ?? [],
                    [
                        'development' => [
                            'status' => $status,
                            'variant' => $variant,
                            'assessmentCycle' => $cycle,
                            'assessmentDate' => $date,
                            'assessor' => $assessor,
                            'interpretation' => 'Formal scoring pending official DepEd/ECCD Council integration.',
                            'flaggedDomains' => [],
                        ],
                    ]
                ),
            ]);

            // 2. Add to child 360 timeline
            $childService->addTimelineEvent($childId, [
                'type' => 'Development Assessment',
                'title' => "ECCD Development Assessment Administered ({$cycle})",
                'description' => "Status: {$status}. Assessor: {$assessor}. Notes: " . ($notes ?: 'Assessment session completed.'),
                'author' => $assessor,
                'badgeVariant' => $variant,
            ]);

            // 3. Queue into Follow-up if action is required
            if ($status === 'Follow-up Required') {
                $fupId = 'FUP-2026-' . rand(100, 999);
                $childService->updateChild($childId, [
                    'statusPillars' => array_merge(
                        $childService->getStatusPillars($childId) ?? [],
                        [
                            'followUp' => [
                                'status' => 'Active Follow-up',
                                'variant' => 'warning',
                                'activeCaseId' => $fupId,
                                'issue' => 'Follow-up required from ECCD Development Assessment',
                                'priority' => 'High',
                                'dueDate' => date('M d, Y', strtotime($date . ' + 30 days')),
                                'assignedWorker' => $assessor,
                            ],
                        ]
                    ),
                ]);

                $childService->addTimelineEvent($childId, [
                    'type' => 'Follow-up',
                    'title' => "Follow-up Case Opened ({$fupId})",
                    'description' => "Case queued from developmental assessment: {$notes}",
                    'author' => $assessor,
                    'badgeVariant' => 'warning',
                ]);
            }
        }

        return [
            'success' => true,
            'message' => 'Development assessment recorded successfully. Child 360° Profile updated.',
            'record' => $newRecord,
            'developmentStatus' => $status,
        ];
    }

    /**
     * GET /api/development/reference
     * Returns official ECCD checklist framework integration specification and placeholders.
     */
    public function getReference(): array
    {
        return [
            'framework' => 'Philippine Early Childhood Care and Development (ECCD) Assessment System',
            'governance' => 'National ECCD Council / Department of Education / CSWDO',
            'integrationStatus' => 'Pending Official Checklist and Scoring Tables',
            'placeholders' => [
                'checklistPoint' => 'OFFICIAL ECCD CHECKLIST INTEGRATION POINT',
                'record1' => '[PLACEHOLDER — CONNECT OFFICIAL ECCD CHECKLIST CHILD’S RECORD 1 HERE]',
                'record2' => '[PLACEHOLDER — CONNECT OFFICIAL ECCD CHECKLIST CHILD’S RECORD 2 HERE]',
                'scoringPoint' => 'OFFICIAL SCORING INTEGRATION POINT',
                'scoringReference' => '[PLACEHOLDER — CONNECT OFFICIAL SCALED SCORE / STANDARD SCORE REFERENCE HERE]',
            ],
            'neutralStatuses' => [
                'Assessment Pending',
                'Assessment Completed',
                'Follow-up Required',
            ],
            'guidelines' => 'Do not invent official checklist questions. Do not invent official scores. Do not invent developmental standards.',
        ];
    }
}
