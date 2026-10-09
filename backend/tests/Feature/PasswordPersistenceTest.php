<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PasswordPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_reset_and_persistence_across_system_resets(): void
    {
        // Seed default roles and users
        $this->seed(UserSeeder::class);

        $admin = User::where('email', 'admin@eccd.gov.ph')->first();
        $this->assertNotNull($admin, 'Admin user must exist in database');

        $newPassword = 'NewSecretAdmin2026!';

        // 1. Reset password via API endpoint
        $resetResponse = $this->postJson("/api/users/{$admin->id}/reset-password", [
            'password' => $newPassword,
        ]);

        $resetResponse->assertStatus(200)
            ->assertJson([
                'ok' => true,
                'status' => 200,
                'active_password' => $newPassword,
            ]);

        // 2. Old password should fail authentication
        $failedLogin = $this->postJson('/api/auth/login', [
            'email' => 'admin@eccd.gov.ph',
            'password' => 'Eccd@$SULpX',
        ]);
        $failedLogin->assertStatus(401);

        // 3. New password should succeed authentication
        $successLogin = $this->postJson('/api/auth/login', [
            'email' => 'admin@eccd.gov.ph',
            'password' => $newPassword,
        ]);
        $successLogin->assertStatus(200)
            ->assertJsonStructure([
                'ok',
                'data' => [
                    'access_token',
                    'user' => ['id', 'email'],
                ],
            ]);

        // 4. Trigger system reset (/api/system/reset-demo-data)
        $systemReset = $this->postJson('/api/system/reset-demo-data');
        $systemReset->assertStatus(200);

        // 5. CRITICAL: After system reset or seeder re-run, new password MUST STILL WORK!
        $loginAfterReset = $this->postJson('/api/auth/login', [
            'email' => 'admin@eccd.gov.ph',
            'password' => $newPassword,
        ]);
        $loginAfterReset->assertStatus(200)
            ->assertJsonStructure([
                'ok',
                'data' => ['access_token'],
            ]);

        // 6. Users list must report active_password accurately
        $usersList = $this->getJson('/api/users');
        $usersList->assertStatus(200);
        $userData = collect($usersList->json('data'))->firstWhere('email', 'admin@eccd.gov.ph');
        $this->assertEquals($newPassword, $userData['active_password']);
    }
}
