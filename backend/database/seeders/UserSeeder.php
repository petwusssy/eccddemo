<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Seed the default roles and users for JWT auth demo.
     */
    public function run(): void
    {
        // 1. Seed the Two Standard Roles
        $adminRole = Role::updateOrCreate(
            ['name' => 'eccd_admin'],
            [
                'label' => 'ECCD Administrative',
                'description' => 'Responsible for consolidating data, coordinating requirements, planning and organizing programs and services.',
                'permissions' => ['*'],
            ]
        );

        $cdtRole = Role::updateOrCreate(
            ['name' => 'cdt'],
            [
                'label' => 'Child Development Teacher (CDT)',
                'description' => 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
                'permissions' => [
                    'community-mapping',
                    'children',
                    'households',
                    'enrollment',
                    'health-monitoring',
                    'eccd-checklist',
                    'development-assessment',
                    'follow-ups',
                    'community-network',
                ],
            ]
        );

        // Alias support for legacy role records
        Role::updateOrCreate(
            ['name' => 'cswdo_admin'],
            [
                'label' => 'ECCD Administrative',
                'description' => 'Responsible for consolidating data, coordinating requirements, planning and organizing programs and services.',
                'permissions' => ['*'],
            ]
        );

        Role::updateOrCreate(
            ['name' => 'daycare_worker'],
            [
                'label' => 'Child Development Teacher (CDT)',
                'description' => 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
                'permissions' => $cdtRole->permissions,
            ]
        );

        Role::updateOrCreate(
            ['name' => 'field_worker'],
            [
                'label' => 'Child Development Teacher (CDT)',
                'description' => 'Frontline implementer of ECCD programs and services, directly delivering activities and interventions to children and families.',
                'permissions' => $cdtRole->permissions,
            ]
        );

        // 2. Admin User (ECCD Administrative): admin@eccd.gov.ph / password
        User::updateOrCreate(
            ['email' => 'admin@eccd.gov.ph'],
            [
                'name' => 'Ma. Elena D. Santos (ECCD Admin)',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
            ]
        );

        // 3. Frontline User (Child Development Teacher): cdt@eccd.gov.ph / password
        User::updateOrCreate(
            ['email' => 'cdt@eccd.gov.ph'],
            [
                'name' => 'Remedios D. Garcia, CDT',
                'password' => Hash::make('password'),
                'role_id' => $cdtRole->id,
            ]
        );

        // Support existing worker@eccd.gov.ph
        User::updateOrCreate(
            ['email' => 'worker@eccd.gov.ph'],
            [
                'name' => 'Remedios D. Garcia, CDT',
                'password' => Hash::make('password'),
                'role_id' => $cdtRole->id,
            ]
        );
    }
}
