<?php

namespace App\Services;

class HealthMonitoringService
{
    /**
     * In-memory store for health monitoring records keyed by Child ECCD ID.
     * Enrolled daycare children receive monthly height and weight monitoring.
     * NOTE: Strictly measurement and monitoring data. No medical diagnoses or recommendations.
     */
    protected static array $healthRecords = [];

    /**
     * List of children for monthly monitoring registry.
     */
    protected static array $monitoredChildren = [];

    /**
     * Clear all static in-memory health records.
     */
    public static function resetStaticData(): void
    {
        self::$healthRecords = [];
        self::$monitoredChildren = [];
    }

    /**
     * GET /api/health-monitoring/due
     * Returns dashboard counts and list of children filtered by status, barangay, or center.
     */
    public function getDueMonitoring(array $filters = []): array
    {
        $children = [];

        try {
            $dbChildren = \App\Models\Child::with(['household', 'barangay', 'dayCareCenter', 'healthMonitorings'])->get();
            foreach ($dbChildren as $c) {
                $latest = $c->healthMonitorings->sortByDesc('date')->first();
                $hasRecord = $latest !== null;
                $status = $hasRecord ? 'Up to Date' : ($c->health_status === 'Up to Date' ? 'Up to Date' : 'Due');

                $birth = $c->birth_date ? new \DateTime($c->birth_date) : new \DateTime('2023-01-01');
                $now = new \DateTime();
                $diff = $now->diff($birth);
                $ageYears = $diff->y;

                $children[] = [
                    'childId' => $c->eccd_id,
                    'fullName' => trim("{$c->first_name} {$c->last_name}"),
                    'sex' => $c->sex ?? 'Female',
                    'ageDisplay' => "{$ageYears} yrs",
                    'barangay' => $c->barangay?->name ?? 'San Isidro',
                    'dayCareCenter' => $c->dayCareCenter?->name ?? 'San Isidro Child Development Center I',
                    'lastMeasurementDate' => $latest?->date?->toDateString(),
                    'lastHeightCm' => $latest ? (float) $latest->height_cm : null,
                    'lastWeightKg' => $latest ? (float) $latest->weight_kg : null,
                    'nutritionalStatus' => $latest?->nutritional_status ?? 'Normal Weight',
                    'status' => $status,
                    'daysSinceLastCheck' => $latest ? max(0, (int) (($now->getTimestamp() - strtotime($latest->date)) / 86400)) : 45,
                    'dueDate' => $latest ? date('Y-m-d', strtotime($latest->date . ' + 30 days')) : now()->toDateString(),
                ];
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('HealthMonitoringService getDueMonitoring DB error: ' . $e->getMessage());
            $children = self::$monitoredChildren;
        }

        // Calculate card counts across entire monitored cohort
        $counts = [
            'monitoringDue' => 0,
            'completedThisMonth' => 0,
            'overdue' => 0,
            'upToDate' => 0,
            'totalMonitored' => count($children),
        ];

        foreach ($children as $c) {
            if ($c['status'] === 'Due') {
                $counts['monitoringDue']++;
            } elseif ($c['status'] === 'Overdue') {
                $counts['overdue']++;
            } elseif ($c['status'] === 'Up to Date') {
                $counts['upToDate']++;
            }

            if (isset($c['lastMeasurementDate']) && str_starts_with($c['lastMeasurementDate'], date('Y-m'))) {
                $counts['completedThisMonth']++;
            }
        }

        // Apply filters
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $statusFilter = $filters['status'];
            $children = array_filter($children, fn($c) => strtolower($c['status']) === strtolower($statusFilter));
        }

        if (!empty($filters['barangay']) && $filters['barangay'] !== 'all') {
            $brgy = $filters['barangay'];
            $children = array_filter($children, fn($c) => $c['barangay'] === $brgy);
        }

        if (!empty($filters['dayCareCenter']) && $filters['dayCareCenter'] !== 'all') {
            $center = $filters['dayCareCenter'];
            $children = array_filter($children, fn($c) => $c['dayCareCenter'] === $center);
        }

        if (!empty($filters['search'])) {
            $q = strtolower(trim($filters['search']));
            $children = array_filter($children, function ($c) use ($q) {
                return str_contains(strtolower($c['fullName']), $q)
                    || str_contains(strtolower($c['childId']), $q)
                    || str_contains(strtolower($c['barangay']), $q)
                    || str_contains(strtolower($c['dayCareCenter']), $q);
            });
        }

        return [
            'counts' => $counts,
            'total' => count($children),
            'children' => array_values($children),
        ];
    }

    /**
     * GET /api/children/{id}/health
     * Returns chronological records, current monitoring status, and trend data for graphing.
     */
    public function getChildHealth(string $childId): ?array
    {
        $dbRecords = [];
        $childName = null;
        $barangay = 'San Isidro';
        $dayCareCenter = 'San Isidro Child Development Center I';
        $status = 'Due';

        try {
            $child = \App\Models\Child::with(['household', 'barangay', 'dayCareCenter', 'healthMonitorings'])->where('eccd_id', $childId)->orWhere('id', $childId)->first();
            if ($child) {
                $childName = trim("{$child->first_name} {$child->last_name}");
                $barangay = $child->barangay?->name ?? 'San Isidro';
                $dayCareCenter = $child->dayCareCenter?->name ?? 'San Isidro Child Development Center I';
                $recordsCollection = \App\Models\HealthMonitoring::where('child_id', $child->eccd_id)->orderBy('date', 'desc')->get();
                foreach ($recordsCollection as $hm) {
                    $dbRecords[] = [
                        'id' => 'HLT-' . $hm->id,
                        'childId' => $child->eccd_id,
                        'date' => $hm->date?->toDateString(),
                        'heightCm' => (float) $hm->height_cm,
                        'weightKg' => (float) $hm->weight_kg,
                        'nutritionalStatus' => $hm->nutritional_status ?? 'Normal Weight',
                        'recordedBy' => $hm->recorded_by ?? 'CSWDO Day Care Worker',
                        'notes' => $hm->notes ?? '',
                        'createdAt' => $hm->created_at?->toIso8601String() ?? now()->toIso8601String(),
                    ];
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('getChildHealth DB error: ' . $e->getMessage());
        }

        $records = !empty($dbRecords) ? $dbRecords : (self::$healthRecords[$childId] ?? []);

        // Sort chronological ascending for trend visualization
        $sortedAscending = $records;
        usort($sortedAscending, function ($a, $b) {
            $cmp = strcmp($a['date'] ?? '', $b['date'] ?? '');
            if ($cmp !== 0) return $cmp;
            $cmpCreated = strcmp($a['createdAt'] ?? '', $b['createdAt'] ?? '');
            if ($cmpCreated !== 0) return $cmpCreated;
            return strcmp($a['id'] ?? '', $b['id'] ?? '');
        });

        $trendData = array_map(function ($r) {
            return [
                'date' => $r['date'],
                'heightCm' => (float) $r['heightCm'],
                'weightKg' => (float) $r['weightKg'],
                'ageMonths' => $r['ageMonths'] ?? null,
            ];
        }, $sortedAscending);

        // Sort descending for history table (newest first)
        $sortedDescending = $records;
        usort($sortedDescending, function ($a, $b) {
            $cmp = strcmp($b['date'] ?? '', $a['date'] ?? '');
            if ($cmp !== 0) return $cmp;
            $cmpCreated = strcmp($b['createdAt'] ?? '', $a['createdAt'] ?? '');
            if ($cmpCreated !== 0) return $cmpCreated;
            return strcmp($b['id'] ?? '', $a['id'] ?? '');
        });

        // Add growth delta to historical records
        for ($i = 0; $i < count($sortedDescending); $i++) {
            $current = &$sortedDescending[$i];
            $previous = $sortedDescending[$i + 1] ?? null;

            if ($previous) {
                $heightDiff = round($current['heightCm'] - $previous['heightCm'], 1);
                $weightDiff = round($current['weightKg'] - $previous['weightKg'], 2);
                $current['deltaHeight'] = ($heightDiff >= 0 ? '+' : '') . $heightDiff . ' cm';
                $current['deltaWeight'] = ($weightDiff >= 0 ? '+' : '') . $weightDiff . ' kg';
            } else {
                $current['deltaHeight'] = 'Baseline';
                $current['deltaWeight'] = 'Baseline';
            }
        }

        $latest = $sortedDescending[0] ?? null;
        if ($latest) {
            $latestDate = $latest['date'];
            $daysSince = (int) ((strtotime(now()->toDateString()) - strtotime($latestDate)) / 86400);
            if ($daysSince <= 30) {
                $status = 'Up to Date';
            } elseif ($daysSince <= 45) {
                $status = 'Due';
            } else {
                $status = 'Overdue';
            }
        }

        return [
            'childId' => $childId,
            'childName' => $childName ?: ($childProfile['fullName'] ?? 'Child ' . $childId),
            'barangay' => $barangay,
            'dayCareCenter' => $dayCareCenter,
            'monitoringStatus' => $status,
            'latestMeasurement' => $latest,
            'history' => $sortedDescending,
            'trendData' => $trendData,
        ];
    }

    /**
     * POST /api/children/{id}/health
     * Create a new monthly height and weight measurement record.
     * Integrates with Child 360° Profile: updates health status and timeline.
     */
    public function recordChildHealth(string $childId, array $data, ?ChildManagementService $childService = null): array
    {
        $newId = 'HLT-REC-' . str_pad((string) rand(100, 999), 3, '0', STR_PAD_LEFT);
        $date = $data['date'] ?? now()->toDateString();
        $height = (float) ($data['height'] ?? $data['heightCm'] ?? 0);
        $weight = (float) ($data['weight'] ?? $data['weightKg'] ?? 0);
        $notes = trim($data['notes'] ?? '');
        $recordedBy = $data['recordedBy'] ?? 'CSWDO Day Care Worker';
        $nutritionalStatus = $data['nutritionalStatus'] ?? 'Normal Weight';

        try {
            $child = \App\Models\Child::where('eccd_id', $childId)->orWhere('id', $childId)->first();
            if ($child) {
                $child->health_status = 'Up to Date';
                $child->save();

                $dbHm = \App\Models\HealthMonitoring::create([
                    'child_id' => $child->eccd_id,
                    'date' => $date,
                    'age_months' => $data['ageMonths'] ?? 36,
                    'height_cm' => $height,
                    'weight_kg' => $weight,
                    'nutritional_status' => $nutritionalStatus,
                    'opt_plus_class' => $data['optPlusClass'] ?? null,
                    'deworming_done' => !empty($data['dewormingDone']),
                    'vitamin_a_supplement' => !empty($data['vitaminASupplement']),
                    'notes' => $notes,
                    'recorded_by' => $recordedBy,
                ]);
                $newId = 'HLT-' . $dbHm->id;
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('recordChildHealth DB error: ' . $e->getMessage());
        }

        $newRecord = [
            'id' => $newId,
            'childId' => $childId,
            'date' => $date,
            'heightCm' => $height,
            'weightKg' => $weight,
            'nutritionalStatus' => $nutritionalStatus,
            'recordedBy' => $recordedBy,
            'notes' => $notes,
            'createdAt' => now()->toIso8601String(),
        ];

        if (!isset(self::$healthRecords[$childId])) {
            self::$healthRecords[$childId] = [];
        }
        array_unshift(self::$healthRecords[$childId], $newRecord);

        // Update monitored children cache
        $found = false;
        foreach (self::$monitoredChildren as &$child) {
            if ($child['childId'] === $childId) {
                $child['lastMeasurementDate'] = $date;
                $child['lastHeightCm'] = $height;
                $child['lastWeightKg'] = $weight;
                $child['nutritionalStatus'] = $nutritionalStatus;
                $child['status'] = 'Up to Date';
                $child['daysSinceLastCheck'] = 0;
                $child['dueDate'] = date('Y-m-d', strtotime($date . ' + 30 days'));
                $found = true;
                break;
            }
        }

        if (!$found) {
            self::$monitoredChildren[] = [
                'childId' => $childId,
                'fullName' => $data['childName'] ?? 'Enrolled Child',
                'sex' => $data['sex'] ?? 'Unknown',
                'ageDisplay' => $data['ageDisplay'] ?? '3 yrs',
                'barangay' => $data['barangay'] ?? 'San Isidro',
                'dayCareCenter' => $data['dayCareCenter'] ?? 'Day Care Center',
                'lastMeasurementDate' => $date,
                'lastHeightCm' => $height,
                'lastWeightKg' => $weight,
                'nutritionalStatus' => $nutritionalStatus,
                'status' => 'Up to Date',
                'daysSinceLastCheck' => 0,
                'dueDate' => date('Y-m-d', strtotime($date . ' + 30 days')),
            ];
        }

        // Child 360° Profile Integration: Update Health Pillar & Timeline
        if ($childService) {
            // Update child status pillar
            $childService->updateChild($childId, [
                'statusPillars' => array_merge(
                    $childService->getStatusPillars($childId) ?? [],
                    [
                        'health' => [
                            'status' => 'Up to date',
                            'variant' => 'success',
                            'lastWeightKg' => $weight,
                            'lastHeightCm' => $height,
                            'nutritionalStatus' => $nutritionalStatus,
                            'lastMeasurementDate' => $date,
                            'nextDue' => date('M d, Y', strtotime($date . ' + 30 days')),
                        ],
                    ]
                ),
            ]);

            // Add to child 360 timeline
            $childService->addTimelineEvent($childId, [
                'type' => 'Health Monitoring',
                'title' => 'Monthly Growth Measurement Recorded',
                'description' => "Recorded height: {$height} cm, weight: {$weight} kg. Measurement notes: " . ($notes ?: 'Routine monthly check.'),
                'author' => $recordedBy,
                'badgeVariant' => 'info',
            ]);
        }

        return [
            'success' => true,
            'message' => 'Monthly health measurement recorded successfully.',
            'record' => $newRecord,
            'monitoringStatus' => 'Up to Date',
            'nextDueDate' => date('Y-m-d', strtotime($date . ' + 30 days')),
        ];
    }

    /**
     * PUT /api/health-monitoring/{id}
     * Update an existing health monitoring record.
     */
    public function updateHealthRecord(string $recordId, array $data): ?array
    {
        foreach (self::$healthRecords as $childId => &$records) {
            foreach ($records as &$record) {
                if ($record['id'] === $recordId) {
                    if (isset($data['date'])) $record['date'] = $data['date'];
                    if (isset($data['heightCm'])) $record['heightCm'] = (float) $data['heightCm'];
                    if (isset($data['height'])) $record['heightCm'] = (float) $data['height'];
                    if (isset($data['weightKg'])) $record['weightKg'] = (float) $data['weightKg'];
                    if (isset($data['weight'])) $record['weightKg'] = (float) $data['weight'];
                    if (isset($data['notes'])) $record['notes'] = trim($data['notes']);
                    if (isset($data['recordedBy'])) $record['recordedBy'] = $data['recordedBy'];

                    $record['updatedAt'] = now()->toIso8601String();

                    return $record;
                }
            }
        }

        return null;
    }
}
