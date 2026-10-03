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
        // 1. Ensure Default Roles Exist
        $adminRole = Role::firstOrCreate(
            ['name' => 'cswdo_admin'],
            [
                'label' => 'CSWDO Administrator / Supervisor',
                'description' => 'Full administrative access across all LGU barangays, centers, and system controls.',
                'permissions' => ['*'],
            ]
        );

        $workerRole = Role::firstOrCreate(
            ['name' => 'daycare_worker'],
            [
                'label' => 'Child Development Worker (CDW)',
                'description' => 'Child Development Center management, enrollment, health monitoring, and checklist evaluations.',
                'permissions' => ['daycare-centers', 'enrollment', 'health-monitoring', 'eccd-checklist', 'follow-ups', 'children'],
            ]
        );

        Role::firstOrCreate(
            ['name' => 'field_worker'],
            [
                'label' => 'Service Provider / Field Worker',
                'description' => 'Community mapping, household profiling, child registration, and spot map management.',
                'permissions' => ['community-mapping', 'children', 'households', 'resources', 'dashboard'],
            ]
        );

        // 2. Admin User: admin@eccd.gov.ph / password
        User::updateOrCreate(
            ['email' => 'admin@eccd.gov.ph'],
            [
                'name' => 'CSWDO Administrator',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
            ]
        );

        // 3. Child Development Worker: worker@eccd.gov.ph / password
        User::updateOrCreate(
            ['email' => 'worker@eccd.gov.ph'],
            [
                'name' => 'Maria C. Santos (CDW)',
                'password' => Hash::make('password'),
                'role_id' => $workerRole->id,
            ]
        );
    }
}
