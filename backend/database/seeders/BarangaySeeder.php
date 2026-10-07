<?php

namespace Database\Seeders;

use App\Models\Barangay;
use App\Models\MappingActivity;
use App\Services\CommunityService;
use Illuminate\Database\Seeder;

class BarangaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (CommunityService::SAN_FERNANDO_BARANGAYS as $i => $name) {
            $code = sprintf('BRGY-%02d', $i + 1);
            Barangay::firstOrCreate(
                ['code' => $code],
                [
                    'name' => $name,
                    'district' => 'City of San Fernando',
                    'city' => 'City of San Fernando',
                    'under5_population' => 0,
                    'target_children' => 0,
                ]
            );
        }

        MappingActivity::firstOrCreate(
            ['code' => 'ACT-MAP-2026-001'],
            [
                'name' => '2026 Annual CSWDO House-to-House Child Mapping Drive',
                'year' => '2026',
                'start_date' => '2026-09-01',
                'end_date' => '2026-11-30',
                'target_households' => 450,
                'mapped_households' => 0,
                'children_identified' => 0,
                'status' => 'In Progress',
            ]
        );
    }
}
