<?php

namespace Database\Seeders;

use App\Models\Barangay;
use App\Models\DayCareCenter;
use App\Models\Worker;
use App\Services\CommunityService;
use Illuminate\Database\Seeder;

class SanFernandoCDCSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Pre-populates all 35 official barangays of the City of San Fernando, Pampanga
     * with their respective official Child Development Centers (CDCs) and assigned CDWs.
     */
    public function run(): void
    {
        // Sample baseline CDWs to link to centers
        $sampleWorkers = [
            'Sindalan' => ['name' => 'Remedios D. Garcia, CDT', 'role' => 'Child Development Teacher', 'contact' => '0917-555-0101'],
            'Dolores' => ['name' => 'Maritess S. Pangilinan, CDW', 'role' => 'Child Development Worker', 'contact' => '0918-555-0102'],
            'San Agustin' => ['name' => 'Corazon M. David, CDW', 'role' => 'Child Development Worker', 'contact' => '0919-555-0103'],
            'San Isidro' => ['name' => 'Josefina T. Santos, CDW', 'role' => 'Child Development Worker', 'contact' => '0920-555-0104'],
            'Calulut' => ['name' => 'Carmelita R. Manalo, CDW', 'role' => 'Child Development Worker', 'contact' => '0921-555-0105'],
            'Bulaon' => ['name' => 'Lourdes E. Pineda, CDW', 'role' => 'Child Development Worker', 'contact' => '0922-555-0106'],
            'San Jose' => ['name' => 'Rowena B. Castro, CDW', 'role' => 'Child Development Worker', 'contact' => '0923-555-0107'],
            'San Nicolas' => ['name' => 'Esperanza L. Henson, CDW', 'role' => 'Child Development Worker', 'contact' => '0924-555-0108'],
            'Santo Rosario (Poblacion)' => ['name' => 'Ma. Luisa F. Guinto, CDW', 'role' => 'Child Development Worker', 'contact' => '0925-555-0109'],
            'Telabastagan' => ['name' => 'Flordeliza S. Mercado, CDW', 'role' => 'Child Development Worker', 'contact' => '0926-555-0110'],
        ];

        foreach (CommunityService::SAN_FERNANDO_BARANGAYS as $i => $name) {
            $brgyCode = sprintf('BRGY-%02d', $i + 1);

            // 1. Ensure Barangay exists
            $barangay = Barangay::firstOrCreate(
                ['code' => $brgyCode],
                [
                    'name' => $name,
                    'district' => 'City of San Fernando',
                    'city' => 'City of San Fernando',
                    'under5_population' => 120,
                    'target_children' => 80,
                ]
            );

            // Clean display name for CDC
            $cleanName = str_replace([' (Pulung Bulo)', ' (San Pedro Cutud)', ' (Poblacion)'], '', $name);
            $cdcName = $cleanName . ' Child Development Center';
            $cdcCode = sprintf('CDC-CSFP-%02d', $i + 1);

            // 2. Pre-populate CDC for this barangay
            $cdc = DayCareCenter::firstOrCreate(
                ['code' => $cdcCode],
                [
                    'name' => $cdcName,
                    'barangay_id' => $barangay->id,
                    'address' => 'Barangay Hall Compound, ' . $name . ', City of San Fernando, Pampanga',
                    'capacity' => 60,
                    'enrolled_count' => 0,
                    'status' => 'Accredited',
                    'accreditation_level' => 'Level 3',
                ]
            );

            // 3. Link an official worker if present for this barangay or sample baseline
            if (isset($sampleWorkers[$name])) {
                $wData = $sampleWorkers[$name];
                Worker::firstOrCreate(
                    ['name' => $wData['name']],
                    [
                        'role' => $wData['role'],
                        'day_care_center_id' => $cdc->id,
                        'barangay_id' => $barangay->id,
                        'contact' => $wData['contact'],
                        'status' => 'Active',
                    ]
                );
            }
        }
    }
}
