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
        $sysUser = User::firstOrNew(['email' => 'sysadmin@csfp.gov.ph']);
        $sysUser->name = $sysUser->name ?: 'CSFP MIS System Administrator';
        $sysUser->role_id = $sysadminRole->id;
        if (!$sysUser->exists || empty($sysUser->password)) {
            $sysUser->password = Hash::make('password');
            $sysUser->temp_password = 'password';
        } elseif (empty($sysUser->temp_password)) {
            $sysUser->temp_password = 'password';
        }
        $sysUser->save();

        // 3. Seed 2: ECCD Administrative (CSWDO Daycare Operations & Supervisory Head)
        // Credentials: admin@eccd.gov.ph / Eccd@$SULpX
        $adminUser = User::firstOrNew(['email' => 'admin@eccd.gov.ph']);
        $adminUser->name = $adminUser->name ?: 'Ma. Elena D. Santos, RSW (ECCD Admin)';
        $adminUser->role_id = $adminRole->id;
        if (!$adminUser->exists || empty($adminUser->password)) {
            $adminUser->password = Hash::make('Eccd@$SULpX');
            $adminUser->temp_password = 'Eccd@$SULpX';
        } elseif (empty($adminUser->temp_password)) {
            $adminUser->temp_password = 'Eccd@$SULpX';
        }
        $adminUser->save();

        // 4. Seed 3: Frontline User (Child Development Teacher)
        // Credentials: cdt@eccd.gov.ph / password
        $cdtUser = User::firstOrNew(['email' => 'cdt@eccd.gov.ph']);
        $cdtUser->name = $cdtUser->name ?: 'Remedios D. Garcia, CDT';
        $cdtUser->role_id = $cdtRole->id;
        if (!$cdtUser->exists || empty($cdtUser->password)) {
            $cdtUser->password = Hash::make('password');
            $cdtUser->temp_password = 'password';
        } elseif (empty($cdtUser->temp_password)) {
            $cdtUser->temp_password = 'password';
        }
        $cdtUser->save();

        // Support existing worker@eccd.gov.ph
        $workerUser = User::firstOrNew(['email' => 'worker@eccd.gov.ph']);
        $workerUser->name = $workerUser->name ?: 'Remedios D. Garcia, CDT';
        $workerUser->role_id = $cdtRole->id;
        if (!$workerUser->exists || empty($workerUser->password)) {
            $workerUser->password = Hash::make('password');
            $workerUser->temp_password = 'password';
        } elseif (empty($workerUser->temp_password)) {
            $workerUser->temp_password = 'password';
        }
        $workerUser->save();
    }
}
