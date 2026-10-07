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
}
