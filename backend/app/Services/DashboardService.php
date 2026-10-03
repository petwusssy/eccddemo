<?php

namespace App\Services;

class DashboardService
{
    /**
     * Get top-level dashboard summary metrics.
     * Initial clean slate: 0 active operational records.
     */
    public function getSummary(): array
    {
        return [
            'totalChildren' => 0,
            'mappedChildren' => 0,
            'mappedPercentage' => 0,
            'enrolledChildren' => 0,
            'enrolledPercentage' => 0,
            'notEnrolledChildren' => 0,
            'notEnrolledPercentage' => 0,
            'pendingChildren' => 0,
            'pendingPercentage' => 0,
            'healthMonitoringDue' => 0,
            'developmentFollowups' => 0,
            'totalBarangays' => count(CommunityService::SAN_FERNANDO_BARANGAYS),
            'barangaysNeedingAttention' => 0,
            'reportingSchoolYear' => 'SY 2026–2027',
            'cityMunicipality' => 'City of San Fernando, Pampanga',
            'lastUpdated' => now()->toIso8601String(),
            'coreAnswers' => [
                'identifiedChildren' => '0 children aged 0–4 documented in system',
                'enrolledChildren' => '0 enrolled in CDCs and SNP programs (0%)',
                'notEnrolledChildren' => '0 not enrolled',
                'needsHealthMonitoring' => '0 children due/overdue for immunization or growth monitoring',
                'needsDevFollowup' => '0 children flagged for developmental domain delays or re-assessment',
                'barangaysNeedingAttention' => 'All barangays in good standing (0 priority cases)',
            ],
        ];
    }

    /**
     * Get enrollment status breakdown.
     */
    public function getEnrollment(): array
    {
        return [
            'total' => 0,
            'breakdown' => [
                [
                    'key' => 'enrolled',
                    'label' => 'Enrolled in CDC / SNP',
                    'count' => 0,
                    'percentage' => 0,
                    'statusColor' => 'success',
                    'subcategories' => [
                        ['label' => 'Child Development Center (CDC)', 'count' => 0, 'percentage' => 0],
                        ['label' => 'Supervised Neighborhood Play (SNP)', 'count' => 0, 'percentage' => 0],
                    ],
                ],
                [
                    'key' => 'not_enrolled',
                    'label' => 'Not Enrolled',
                    'count' => 0,
                    'percentage' => 0,
                    'statusColor' => 'danger',
                    'subcategories' => [
                        ['label' => 'Age 3–4 Priority Target for CDC', 'count' => 0, 'percentage' => 0],
                        ['label' => 'Age 0–2 Home Care / Unserved', 'count' => 0, 'percentage' => 0],
                    ],
                ],
                [
                    'key' => 'pending',
                    'label' => 'Pending / Unknown',
                    'count' => 0,
                    'percentage' => 0,
                    'statusColor' => 'warning',
                    'subcategories' => [
                        ['label' => 'Recently Relocated / Transient', 'count' => 0, 'percentage' => 0],
                        ['label' => 'Pending Barangay Worker Verification', 'count' => 0, 'percentage' => 0],
                    ],
                ],
            ],
            'targetCohortComparison' => [
                'targetAnnualEnrollment' => 0,
                'targetMetPercentage' => 0,
                'availableCenterSlots' => 0,
                'occupancyRate' => 0,
            ],
        ];
    }

    /**
     * Get health & developmental monitoring status.
     */
    public function getMonitoring(): array
    {
        return [
            'health' => [
                'total' => 0,
                'upToDate' => [
                    'label' => 'Up to date',
                    'count' => 0,
                    'percentage' => 0,
                    'variant' => 'success',
                    'description' => 'Complete immunization and normal OPT Plus weighing records',
                ],
                'due' => [
                    'label' => 'Due this month',
                    'count' => 0,
                    'percentage' => 0,
                    'variant' => 'warning',
                    'description' => 'Scheduled for quarterly anthropometric or vit A supplementation',
                ],
                'overdue' => [
                    'label' => 'Overdue (>30 days)',
                    'count' => 0,
                    'percentage' => 0,
                    'variant' => 'danger',
                    'description' => 'Missed immunization milestone or unrecorded nutritional check',
                ],
            ],
            'development' => [
                'total' => 0,
                'completed' => [
                    'label' => 'Completed',
                    'count' => 0,
                    'percentage' => 0,
                    'variant' => 'success',
                    'description' => 'Standard ECCD assessment (First or Second cycle) completed',
                ],
                'pending' => [
                    'label' => 'Pending Evaluation',
                    'count' => 0,
                    'percentage' => 0,
                    'variant' => 'neutral',
                    'description' => 'Baseline checklist scheduled with Child Development Worker',
                ],
                'followUp' => [
                    'label' => 'Follow-up Needed',
                    'count' => 0,
                    'percentage' => 0,
                    'variant' => 'danger',
                    'description' => 'Flagged domain delay (Gross Motor, Fine Motor, Language, Cognitive)',
                ],
            ],
            'criticalAlerts' => [],
        ];
    }

    /**
     * Get children breakdown by barangay ranked by priority attention needed.
     */
    public function getBarangays(): array
    {
        $barangayNames = CommunityService::SAN_FERNANDO_BARANGAYS;
        $ranked = [];
        foreach ($barangayNames as $index => $name) {
            $ranked[] = [
                'rank' => $index + 1,
                'name' => $name,
                'totalChildren' => 0,
                'enrolled' => 0,
                'enrolledPercent' => 0,
                'notEnrolled' => 0,
                'healthDue' => 0,
                'devFollowup' => 0,
                'riskLevel' => 'Good Standing',
                'priorityVariant' => 'success',
                'assignedWorker' => 'Assigned CDW',
                'daycareCenters' => 1,
                'primaryIssue' => 'No active alerts',
            ];
        }

        return [
            'totalBarangays' => count($barangayNames),
            'summaryNeedingAttention' => 0,
            'rankedBarangays' => $ranked,
        ];
    }

    /**
     * Get operational list of children needing immediate attention.
     */
    public function getAttention(): array
    {
        return [
            'totalNeedingAttention' => 0,
            'highPriorityCount' => 0,
            'items' => [],
        ];
    }

    /**
     * Get recent activities across mapping, enrollment, health and assessments.
     */
    public function getRecentActivity(): array
    {
        return [
            'activities' => [],
        ];
    }
}
