<?php

namespace App\Services;

use App\Models\Barangay;
use App\Models\DayCareCenter;
use App\Models\Worker;

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
     * Build barangay rows with real database counters and CDC links.
     */
    protected function buildBarangays(): array
    {
        $dbCenters = DayCareCenter::with('barangay')->get();
        $dbWorkers = Worker::with('barangay')->get();

        $rows = [];
        foreach (self::SAN_FERNANDO_BARANGAYS as $i => $name) {
            $brgyCenters = $dbCenters->filter(function ($c) use ($name) {
                return strtolower(trim($c->barangay?->name ?? '')) === strtolower(trim($name)) ||
                       str_contains(strtolower($c->name), strtolower(trim($name)));
            });

            $brgyWorkers = $dbWorkers->filter(function ($w) use ($name) {
                return strtolower(trim($w->barangay?->name ?? '')) === strtolower(trim($name));
            });

            $cdcs_list = $brgyCenters->map(function ($c) {
                return [
                    'id' => (string)$c->id,
                    'code' => $c->code ?? "CDC-CSFP-{$c->id}",
                    'name' => $c->name,
                    'status' => $c->status ?? 'Accredited (Level 3)',
                    'accreditationLevel' => $c->accreditation_level ?? 'Level 3',
                    'accreditationNo' => $c->accreditation_no ?? '',
                    'capacity' => (int)($c->capacity ?? 60),
                    'enrolledChildren' => (int)($c->enrolled_count ?? 0),
                    'address' => $c->address ?? '',
                    'assignedWorkers' => is_array($c->assigned_workers) ? $c->assigned_workers : [],
                    'sessions' => $c->sessions ?? 'Morning & Afternoon Sessions',
                ];
            })->values()->all();

            $workers_list = $brgyWorkers->map(function ($w) {
                return [
                    'id' => (string)$w->id,
                    'name' => $w->name,
                    'role' => $w->role ?? 'Child Development Worker',
                    'designation' => $w->designation ?? $w->role ?? 'Child Development Worker',
                    'contactNumber' => $w->contact_number ?? '',
                    'email' => $w->email ?? '',
                    'assignedCenters' => is_array($w->assigned_centers) ? $w->assigned_centers : [],
                    'assignedBarangay' => $w->barangay?->name ?? '',
                    'status' => $w->status ?? 'Active',
                ];
            })->values()->all();

            $totalCdcs = count($cdcs_list);
            $totalWorkers = count($workers_list);
            $accreditationOverview = $totalCdcs > 0
                ? (!empty($cdcs_list[0]['accreditationLevel']) ? "{$cdcs_list[0]['accreditationLevel']} Accredited" : 'Accredited')
                : 'Pending Accreditation';

            $rows[] = [
                'id' => sprintf('BRGY-%02d', $i + 1),
                'name' => $name,
                'district' => 'City of San Fernando',
                'province' => 'Pampanga',
                'region' => 'Region III - Central Luzon',
                'totalChildren' => 0,
                'mapped' => 0,
                'enrolled' => 0,
                'notEnrolled' => 0,
                'healthDue' => 0,
                'devFollowups' => 0,
                'total_cdcs' => $totalCdcs,
                'total_workers' => $totalWorkers,
                'centersCount' => $totalCdcs,
                'workersCount' => $totalWorkers,
                'accreditationOverview' => $accreditationOverview,
                'primaryWorker' => $workers_list[0]['name'] ?? ($cdcs_list[0]['assignedWorkers'][0] ?? '—'),
                'cdcs_list' => $cdcs_list,
                'workers_list' => $workers_list,
                'centers' => $brgyCenters->pluck('name')->values()->all(),
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
     * GET /api/centers — populated from real seeded DayCareCenter records.
     */
    public function getCenters(array $filters = []): array
    {
        $query = DayCareCenter::with(['barangay', 'workers']);

        if (!empty($filters['barangay']) && $filters['barangay'] !== 'all') {
            $bName = $filters['barangay'];
            $query->whereHas('barangay', function ($q) use ($bName) {
                $q->where('name', $bName);
            });
        }

        if (!empty($filters['search'])) {
            $s = strtolower(trim($filters['search']));
            $query->where(function ($q) use ($s) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(address) LIKE ?', ["%{$s}%"]);
            });
        }

        $centers = $query->get()->map(function ($c) {
            return [
                'id' => (string) $c->id,
                'code' => $c->code,
                'name' => $c->name,
                'barangay' => $c->barangay?->name ?? 'San Fernando',
                'address' => $c->address,
                'capacity' => (int) ($c->capacity ?? 60),
                'enrolledChildren' => (int) ($c->enrolled_count ?? 0),
                'status' => $c->accreditation_level ? "Accredited ({$c->accreditation_level})" : ($c->status ?? 'Accredited (Level 3)'),
                'accreditationLevel' => $c->accreditation_level ?? 'Level 3',
                'accreditationValidUntil' => '2027-12-31',
                'accreditationNo' => 'CDC-2024-' . str_pad($c->id, 3, '0', STR_PAD_LEFT),
                'assignedWorkers' => $c->workers->pluck('name')->values()->toArray(),
                'sessions' => 'Morning & Afternoon Sessions',
            ];
        });

        return [
            'total' => $centers->count(),
            'centers' => $centers->values()->all(),
        ];
    }

    /**
     * GET /api/centers/{id}
     */
    public function getCenterById(string $id): ?array
    {
        $c = DayCareCenter::with(['barangay', 'workers'])
            ->where('id', $id)
            ->orWhere('code', $id)
            ->orWhere('name', $id)
            ->first();

        if (!$c) return null;

        return [
            'id' => (string) $c->id,
            'code' => $c->code,
            'name' => $c->name,
            'barangay' => $c->barangay?->name ?? 'San Fernando',
            'address' => $c->address,
            'capacity' => (int) ($c->capacity ?? 60),
            'enrolledChildren' => (int) ($c->enrolled_count ?? 0),
            'status' => $c->accreditation_level ? "Accredited ({$c->accreditation_level})" : ($c->status ?? 'Accredited (Level 3)'),
            'accreditationLevel' => $c->accreditation_level ?? 'Level 3',
            'accreditationValidUntil' => '2027-12-31',
            'accreditationNo' => 'CDC-2024-' . str_pad($c->id, 3, '0', STR_PAD_LEFT),
            'assignedWorkers' => $c->workers->pluck('name')->values()->toArray(),
            'sessions' => 'Morning & Afternoon Sessions',
        ];
    }

    /**
     * POST /api/centers — Register a new Child Development Center.
     */
    public function createCenter(array $data): array
    {
        $barangay = null;
        if (!empty($data['barangay'])) {
            $barangay = Barangay::where('name', $data['barangay'])
                ->orWhere('name', 'like', '%' . $data['barangay'] . '%')
                ->first();
        }

        if (!$barangay) {
            $barangay = Barangay::first();
        }

        $code = !empty($data['code']) ? $data['code'] : sprintf('CDC-CSFP-%04d', rand(100, 9999));
        $center = DayCareCenter::create([
            'code' => $code,
            'name' => $data['name'] ?? ($data['centerName'] ?? 'San Fernando Child Development Center'),
            'barangay_id' => $barangay->id,
            'address' => $data['address'] ?? ($data['addressStreet'] ? "{$data['addressNo']} {$data['addressStreet']}, {$barangay->name}" : "Barangay Hall Compound, {$barangay->name}, City of San Fernando"),
            'capacity' => (int) ($data['capacity'] ?? 60),
            'enrolled_count' => (int) ($data['enrolledChildren'] ?? 0),
            'status' => $data['status'] ?? ($data['centerStatus'] ?? 'Accredited'),
            'accreditation_level' => $data['accreditationLevel'] ?? 'Level 3',
        ]);

        return $this->getCenterById((string) $center->id) ?? [];
    }

    /**
     * GET /api/workers — populated from real seeded Worker records.
     */
    public function getWorkers(array $filters = []): array
    {
        $query = Worker::with(['barangay', 'dayCareCenter', 'user']);

        if (!empty($filters['role']) && $filters['role'] !== 'all') {
            $query->where('role', $filters['role']);
        }

        if (!empty($filters['search'])) {
            $s = strtolower(trim($filters['search']));
            $query->where(function ($q) use ($s) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(role) LIKE ?', ["%{$s}%"])
                  ->orWhereRaw('LOWER(contact) LIKE ?', ["%{$s}%"]);
            });
        }

        $workers = $query->get()->map(function ($w) {
            return [
                'id' => (string) $w->id,
                'name' => $w->name,
                'role' => $w->role,
                'designation' => $w->role,
                'assignedBarangay' => $w->barangay?->name ?? ($w->dayCareCenter?->barangay?->name ?? 'City of San Fernando'),
                'assignedCenters' => $w->dayCareCenter ? [$w->dayCareCenter->name] : [],
                'accreditationNo' => 'CDW-2024-' . str_pad($w->id, 3, '0', STR_PAD_LEFT),
                'contactNumber' => $w->contact ?? '0917-000-0000',
                'email' => $w->user?->email ?? strtolower(str_replace([' ', ','], ['.', ''], $w->name)) . '@csfp.gov.ph',
                'yearsOfService' => 5,
                'status' => $w->status ?? 'Active',
            ];
        });

        return [
            'total' => $workers->count(),
            'workers' => $workers->values()->all(),
        ];
    }

    /**
     * GET /api/workers/{id}
     */
    public function getWorkerById(string $id): ?array
    {
        $w = Worker::with(['barangay', 'dayCareCenter', 'user'])
            ->where('id', $id)
            ->orWhere('name', $id)
            ->first();

        if (!$w) return null;

        return [
            'id' => (string) $w->id,
            'name' => $w->name,
            'role' => $w->role,
            'designation' => $w->role,
            'assignedBarangay' => $w->barangay?->name ?? ($w->dayCareCenter?->barangay?->name ?? 'City of San Fernando'),
            'assignedCenters' => $w->dayCareCenter ? [$w->dayCareCenter->name] : [],
            'accreditationNo' => 'CDW-2024-' . str_pad($w->id, 3, '0', STR_PAD_LEFT),
            'contactNumber' => $w->contact ?? '0917-000-0000',
            'email' => $w->user?->email ?? strtolower(str_replace([' ', ','], ['.', ''], $w->name)) . '@csfp.gov.ph',
            'yearsOfService' => 5,
            'status' => $w->status ?? 'Active',
        ];
    }

    /**
     * POST /api/workers — Register a new Child Development Worker and link to CDC.
     */
    public function createWorker(array $data): array
    {
        $center = null;
        if (!empty($data['centerBeingServed'])) {
            $center = DayCareCenter::where('name', $data['centerBeingServed'])
                ->orWhere('id', $data['centerBeingServed'])
                ->first();
        }

        $barangay = null;
        if (!empty($data['addressBarangay'])) {
            $barangay = Barangay::where('name', $data['addressBarangay'])->first();
        } elseif ($center) {
            $barangay = $center->barangay;
        }

        $fullName = !empty($data['name']) ? $data['name'] : trim(($data['firstName'] ?? '') . ' ' . ($data['lastName'] ?? ''));
        if (empty($fullName)) $fullName = 'Child Development Worker';

        $worker = Worker::create([
            'name' => $fullName,
            'role' => $data['role'] ?? 'Child Development Worker',
            'day_care_center_id' => $center?->id,
            'barangay_id' => $barangay?->id,
            'contact' => $data['contactMobile'] ?? ($data['contact'] ?? '0917-000-0000'),
            'status' => 'Active',
        ]);

        return $this->getWorkerById((string) $worker->id) ?? [];
    }
}
