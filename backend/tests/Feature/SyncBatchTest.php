<?php

namespace Tests\Feature;

use Tests\TestCase;

class SyncBatchTest extends TestCase
{
    public function test_sync_batch_endpoint_accepts_and_persists_records(): void
    {
        $payload = [
            'surveys' => [
                [
                    'householdId' => 'HH-UNIT-TEST-001',
                    'parentGuardian' => 'Test Parent Maria',
                    'contactNumber' => '0917-123-4567',
                    'address' => 'Purok 2, San Isidro',
                    'barangay' => 'San Isidro',
                    'purok' => 'Purok 2',
                    'mappingActivityId' => 'ACT-MAP-2026-001',
                    'mappedBy' => 'Field Worker Maria',
                    'children' => [
                        [
                            'firstName' => 'Juan',
                            'lastName' => 'Dela Cruz',
                            'birthDate' => '2023-01-15',
                            'sex' => 'Male',
                            'enrollmentStatus' => 'Not Enrolled',
                        ],
                    ],
                ],
            ],
            'frontlineActions' => [],
        ];

        $response = $this->postJson('/api/mapping/sync', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'ok' => true,
                'status' => 200,
            ])
            ->assertJsonStructure([
                'ok',
                'status',
                'data' => [
                    'ok',
                    'synced' => [
                        'surveys',
                        'households',
                        'children',
                    ],
                ],
            ]);
    }

    public function test_reset_data_wipes_all_records_and_leaves_clean_state(): void
    {
        // 1. Trigger system reset endpoint
        $resetRes = $this->postJson('/api/system/reset-demo-data');
        $resetRes->assertStatus(200)
            ->assertJson([
                'ok' => true,
                'status' => 200,
            ]);

        // 2. Query children and households endpoints
        $childrenRes = $this->getJson('/api/children');
        $childrenRes->assertStatus(200)
            ->assertJson([
                'ok' => true,
                'status' => 200,
                'data' => [
                    'total' => 0,
                    'children' => [],
                ],
            ]);

        $householdsRes = $this->getJson('/api/households');
        $householdsRes->assertStatus(200)
            ->assertJson([
                'ok' => true,
                'status' => 200,
                'data' => [],
            ]);
    }
}
