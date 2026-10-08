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
        // 1. Seed the Three Core Roles
        $sysadminRole = Role::updateOrCreate(
            ['name' => 'sysadmin'],
            [
                'label' => 'CSFP System Administrator',
                'description' => 'City IT / MIS Administrator managing system access, tenant security, audit logs, and account provisioning for ECCD Administrative officers and Child Development Teachers.',
                'permissions' => ['*'],
            ]
        );

        $adminRole = Role::updateOrCreate(
            ['name' => 'eccd_admin'],
            [
                'label' => 'ECCD Administrative',
                'description' => 'CSWDO Early Childhood Care Supervisor responsible for city-wide daycare operations, Form 8 & 9 approvals, and consolidated child developmental analytics across 35 barangays.',
                'permissions' => [
                    'dashboard',
                    'children',
                    'households',
                    'community-mapping',
                    'enrollment',
                    'health-monitoring',
                    'eccd-checklist',
                    'development-assessment',
                    'follow-ups',
                    'community-network',
                    'reports',
                    'settings',
                ],
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
                'permissions' => $adminRole->permissions,
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

        // 2. Seed 1: CSFP SYSADMIN (City IT / MIS Admin for Admin Console)
        // Credentials: sysadmin@csfp.gov.ph / password
        User::updateOrCreate(
            ['email' => 'sysadmin@csfp.gov.ph'],
            [
                'name' => 'CSFP MIS System Administrator',
                'password' => Hash::make('password'),
                'role_id' => $sysadminRole->id,
            ]
        );

        // 3. Seed 2: ECCD Administrative (CSWDO Daycare Operations & Supervisory Head)
        // Credentials: admin@eccd.gov.ph / password
        User::updateOrCreate(
            ['email' => 'admin@eccd.gov.ph'],
            [
                'name' => 'Ma. Elena D. Santos, RSW (ECCD Admin)',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
            ]
        );

        // 4. Seed 3: Frontline User (Child Development Teacher)
        // Credentials: cdt@eccd.gov.ph / password
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
