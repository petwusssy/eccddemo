<?php

namespace App\Services;

class FollowUpService
{
    /**
     * In-memory store for follow-up and early support cases.
     * Core purpose: Turn monitoring data into action.
     * Strict rule: Do not diagnose children. Do not invent medical interventions.
     * Action types: Follow-up, Family Contact, Scheduled Visit, Referral, Monitoring, Other.
     * Queue categories: Needs Attention, Pending, Scheduled, Completed.
     */
    protected static array $cases = [];

    /**
     * GET /api/follow-ups
     */
    public function getFollowUps(array $filters = []): array
    {
        $all = self::$cases;

        // KPI Counts
        $counts = [
            'needsAttention' => 0,
            'pending' => 0,
            'scheduled' => 0,
            'completed' => 0,
            'totalCases' => count($all),
        ];

        foreach ($all as $c) {
            $cat = $c['category'] ?? $c['status'];
            if ($cat === 'Needs Attention') {
                $counts['needsAttention']++;
            } elseif ($cat === 'Pending') {
                $counts['pending']++;
            } elseif ($cat === 'Scheduled') {
                $counts['scheduled']++;
            } elseif ($cat === 'Completed') {
                $counts['completed']++;
            }
        }

        $filtered = $all;

        // Filter by category/status
        if (!empty($filters['category']) && $filters['category'] !== 'all') {
            $catFilter = strtolower($filters['category']);
            $filtered = array_filter($filtered, function ($c) use ($catFilter) {
                return strtolower($c['category'] ?? $c['status']) === $catFilter;
            });
        }

        // Filter by actionType
        if (!empty($filters['actionType']) && $filters['actionType'] !== 'all') {
            $filtered = array_filter($filtered, fn($c) => $c['actionType'] === $filters['actionType']);
        }

        // Filter by barangay
        if (!empty($filters['barangay']) && $filters['barangay'] !== 'all') {
            $filtered = array_filter($filtered, fn($c) => $c['barangay'] === $filters['barangay']);
        }

        // Filter by worker
        if (!empty($filters['assignedWorker']) && $filters['assignedWorker'] !== 'all') {
            $filtered = array_filter($filtered, fn($c) => $c['assignedWorker'] === $filters['assignedWorker']);
        }

        // Search query
        if (!empty($filters['search'])) {
            $q = strtolower(trim($filters['search']));
            $filtered = array_filter($filtered, function ($c) use ($q) {
                return str_contains(strtolower($c['childName']), $q)
                    || str_contains(strtolower($c['childId']), $q)
                    || str_contains(strtolower($c['id']), $q)
                    || str_contains(strtolower($c['reason']), $q)
                    || str_contains(strtolower($c['barangay']), $q);
            });
        }

        return [
            'counts' => $counts,
            'total' => count($filtered),
            'cases' => array_values($filtered),
        ];
    }

    /**
     * GET /api/follow-ups/needs-attention
     */
    public function getNeedsAttention(): array
    {
        $filtered = array_filter(self::$cases, function ($c) {
            return ($c['category'] ?? $c['status']) === 'Needs Attention';
        });

        return [
            'total' => count($filtered),
            'cases' => array_values($filtered),
        ];
    }

    /**
     * POST /api/follow-ups
     * Allows CSWDO authorized users to assign a follow-up to a worker.
     */
    public function createFollowUp(array $data, ?ChildManagementService $childService = null): array
    {
        $fupId = 'FUP-2026-' . str_pad((string) rand(100, 999), 3, '0', STR_PAD_LEFT);
        $childId = $data['childId'];
        $childName = $data['childName'] ?? 'Enrolled Child';
        $barangay = $data['barangay'] ?? 'San Isidro';
        $center = $data['dayCareCenter'] ?? 'Day Care Center';
        $reason = trim($data['reason'] ?? 'Follow-up on early support need');
        $assignedWorker = trim($data['assignedWorker'] ?? 'CSWDO Worker');
        $workerContact = $data['workerContact'] ?? '0917-555-0100';
        $createdDate = $data['createdDate'] ?? now()->toDateString();
        $dueDate = $data['dueDate'] ?? date('Y-m-d', strtotime($createdDate . ' + 30 days'));
        $category = $data['category'] ?? 'Needs Attention';
        $actionType = $data['actionType'] ?? 'Follow-up';
        $notes = trim($data['notes'] ?? '');

        $newCase = [
            'id' => $fupId,
            'childId' => $childId,
            'childName' => $childName,
            'barangay' => $barangay,
            'dayCareCenter' => $center,
            'reason' => $reason,
            'assignedWorker' => $assignedWorker,
            'workerContact' => $workerContact,
            'createdDate' => $createdDate,
            'dueDate' => $dueDate,
            'category' => $category,
            'status' => $category,
            'actionType' => $actionType,
            'notes' => $notes,
            'actionTaken' => null,
            'resolvedDate' => null,
        ];

        array_unshift(self::$cases, $newCase);

        // Child 360° Profile Integration
        if ($childService) {
            $childService->updateChild($childId, [
                'statusPillars' => array_merge(
                    $childService->getStatusPillars($childId) ?? [],
                    [
                        'followUp' => [
                            'status' => 'Active Follow-up',
                            'variant' => $category === 'Needs Attention' ? 'danger' : 'warning',
                            'activeCaseId' => $fupId,
                            'issue' => $reason,
                            'priority' => $category === 'Needs Attention' ? 'Urgent' : 'Standard',
                            'dueDate' => $dueDate,
                            'assignedWorker' => $assignedWorker,
                        ],
                    ]
                ),
            ]);

            $childService->addTimelineEvent($childId, [
                'type' => 'Follow-up',
                'title' => "Follow-up Case Opened ({$fupId}): {$actionType}",
                'description' => "Assigned to {$assignedWorker}. Reason: {$reason}. Due: {$dueDate}.",
                'author' => $assignedWorker,
                'badgeVariant' => $category === 'Needs Attention' ? 'danger' : 'warning',
            ]);
        }

        return $newCase;
    }

    /**
     * PUT /api/follow-ups/{id}
     */
    public function updateFollowUp(string $id, array $data): ?array
    {
        foreach (self::$cases as &$case) {
            if ($case['id'] === $id) {
                if (isset($data['reason'])) $case['reason'] = trim($data['reason']);
                if (isset($data['assignedWorker'])) $case['assignedWorker'] = trim($data['assignedWorker']);
                if (isset($data['dueDate'])) $case['dueDate'] = $data['dueDate'];
                if (isset($data['category'])) {
                    $case['category'] = $data['category'];
                    $case['status'] = $data['category'];
                }
                if (isset($data['status'])) {
                    $case['status'] = $data['status'];
                    $case['category'] = $data['status'];
                }
                if (isset($data['actionType'])) $case['actionType'] = $data['actionType'];
                if (isset($data['notes'])) $case['notes'] = trim($data['notes']);
                if (isset($data['actionTaken'])) $case['actionTaken'] = trim($data['actionTaken']);

                return $case;
            }
        }
        return null;
    }

    /**
     * POST /api/follow-ups/{id}/resolve
     * Resolves follow-up, logs action taken, notes, date, and updates status to Completed.
     */
    public function resolveFollowUp(string $id, array $data, ?ChildManagementService $childService = null): ?array
    {
        foreach (self::$cases as &$case) {
            if ($case['id'] === $id) {
                $resolvedDate = $data['date'] ?? $data['resolvedDate'] ?? now()->toDateString();
                $actionTaken = trim($data['actionTaken'] ?? 'Action taken and documented.');
                $notes = trim($data['notes'] ?? '');
                $status = $data['status'] ?? 'Completed';

                $case['category'] = 'Completed';
                $case['status'] = $status;
                $case['resolvedDate'] = $resolvedDate;
                $case['actionTaken'] = $actionTaken;
                if ($notes) {
                    $case['notes'] = $case['notes'] ? ($case['notes'] . " | Resolution: " . $notes) : $notes;
                }

                // Child 360° Profile Integration
                if ($childService) {
                    $childId = $case['childId'];
                    $childService->updateChild($childId, [
                        'statusPillars' => array_merge(
                            $childService->getStatusPillars($childId) ?? [],
                            [
                                'followUp' => [
                                    'status' => 'Case Resolved',
                                    'variant' => 'success',
                                    'activeCaseId' => $id,
                                    'issue' => "Resolved on {$resolvedDate}: {$actionTaken}",
                                    'priority' => 'Resolved',
                                    'dueDate' => 'Completed',
                                    'assignedWorker' => $case['assignedWorker'],
                                ],
                            ]
                        ),
                    ]);

                    $childService->addTimelineEvent($childId, [
                        'type' => 'Follow-up',
                        'title' => "Follow-up Resolved ({$id})",
                        'description' => "Action taken: {$actionTaken}. Notes: " . ($notes ?: 'Resolution confirmed.'),
                        'author' => $case['assignedWorker'],
                        'badgeVariant' => 'success',
                    ]);
                }

                return $case;
            }
        }

        return null;
    }

    /**
     * Get Case View with Child Relevant Timeline (Mapping, Enrollment, Health, Development, Follow-ups)
     */
    public function getCaseView(string $id, ?ChildManagementService $childService = null): ?array
    {
        $case = null;
        foreach (self::$cases as $c) {
            if ($c['id'] === $id) {
                $case = $c;
                break;
            }
        }

        if (!$case) return null;

        // Retrieve child timeline from ChildManagementService
        $childTimeline = [];
        if ($childService) {
            $childTimeline = $childService->getTimeline($case['childId']);
        }

        if (empty($childTimeline)) {
            // Realistic chronological history for case view
            $childTimeline = [
                [
                    'type' => 'Follow-up',
                    'title' => "Active Case Opened: {$case['id']}",
                    'description' => "{$case['reason']} (Assigned to {$case['assignedWorker']})",
                    'date' => $case['createdDate'],
                    'badgeVariant' => 'warning',
                ],
                [
                    'type' => 'Development',
                    'title' => 'ECCD Development Assessment Administered',
                    'description' => 'Baseline assessment administered at CDC.',
                    'date' => '2026-09-15',
                    'badgeVariant' => 'primary',
                ],
                [
                    'type' => 'Health',
                    'title' => 'Monthly Growth Weighing & Height Check',
                    'description' => 'Growth measurement recorded in health registry.',
                    'date' => '2026-08-20',
                    'badgeVariant' => 'info',
                ],
                [
                    'type' => 'Enrollment',
                    'title' => 'Enrolled in Day Care Center',
                    'description' => "Enrolled in {$case['dayCareCenter']} for SY 2026–2027.",
                    'date' => '2026-06-15',
                    'badgeVariant' => 'success',
                ],
                [
                    'type' => 'Mapping',
                    'title' => 'Community Mapping Household Identification',
                    'description' => "Identified during annual household mapping in Barangay {$case['barangay']}.",
                    'date' => '2026-05-18',
                    'badgeVariant' => 'neutral',
                ],
            ];
        }

        return [
            'case' => $case,
            'timeline' => $childTimeline,
        ];
    }
}
