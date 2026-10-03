<?php

namespace App\Services;

class CommunityService
{
    /**
     * Official list of the 35 barangays of the City of San Fernando, Pampanga.
     * This is master reference data only — no mock statistics.
     */
    public const SAN_FERNANDO_BARANGAYS = [
        'Alasas',
        'Baliti',
        'Bulaon',
        'Calulut',
        'Del Carmen',
        'Del Pilar',
        'Del Rosario',
        'Dela Paz Norte',
        'Dela Paz Sur',
        'Dolores',
        'Juliana',
        'Lara',
        'Lourdes',
        'Magliman',
        'Maimpis',
        'Malino',
        'Malpitic',
        'Pandaras',
        'Panipuan',
        'Pulung Bulu (Pulung Bulo)',
        'Quebiawan',
        'Saguin',
        'San Agustin',
        'San Felipe',
        'San Isidro',
        'San Jose',
        'San Juan',
        'San Nicolas',
        'San Pedro (San Pedro Cutud)',
        'Santa Lucia',
        'Santa Teresita',
        'Santo Niño',
        'Santo Rosario (Poblacion)',
        'Sindalan',
        'Telabastagan',
    ];

    /**
     * Build barangay rows with zeroed counters (filled by real records only).
     */
    protected function buildBarangays(): array
    {
        $rows = [];
        foreach (self::SAN_FERNANDO_BARANGAYS as $i => $name) {
            $rows[] = [
                'id' => sprintf('BRGY-%02d', $i + 1),
                'name' => $name,
                'district' => 'City of San Fernando',
                'totalChildren' => 0,
                'mapped' => 0,
                'enrolled' => 0,
                'notEnrolled' => 0,
                'healthDue' => 0,
                'devFollowups' => 0,
                'centersCount' => 0,
                'workersCount' => 0,
                'primaryWorker' => '—',
                'centers' => [],
            ];
        }
        return $rows;
    }

    /**
     * GET /api/barangays
     */
    public function getBarangays(array $filters = []): array
    {
        $all = $this->buildBarangays();

        if (!empty($filters['search'])) {
            $q = strtolower(trim($filters['search']));
            $all = array_filter($all, fn ($b) => str_contains(strtolower($b['name']), $q));
        }

        return [
            'total' => count($all),
            'barangays' => array_values($all),
        ];
    }

    /**
     * GET /api/barangays/{id}
     */
    public function getBarangayById(string $id): ?array
    {
        foreach ($this->buildBarangays() as $b) {
            if ($b['id'] === $id || strtolower($b['name']) === strtolower($id)) {
                return $b;
            }
        }
        return null;
    }

    /**
     * GET /api/centers — no mock centers; populated from real records only.
     */
    public function getCenters(array $filters = []): array
    {
        return ['total' => 0, 'centers' => []];
    }

    /**
     * GET /api/centers/{id}
     */
    public function getCenterById(string $id): ?array
    {
        return null;
    }

    /**
     * GET /api/workers — no mock workers; populated from real records only.
     */
    public function getWorkers(array $filters = []): array
    {
        return ['total' => 0, 'workers' => []];
    }

    /**
     * GET /api/workers/{id}
     */
    public function getWorkerById(string $id): ?array
    {
        return null;
    }
}
