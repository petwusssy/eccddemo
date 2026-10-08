<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Child Model — Universal Persistent Entity
 * 
 * Rule: Child records are NEVER duplicated when enrollment, health monitoring,
 * or developmental assessment occurs. The `eccd_id` is the immutable primary key.
 */
class Child extends Model
{
    use HasFactory;

    protected $table = 'children';

    protected $fillable = [
        'eccd_id',
        'household_id',
        'barangay_id',
        'day_care_center_id',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'birth_date',
        'sex',
        'blood_type',
        'philsys_card_no',
        'psa_birth_cert',
        'enrollment_status',
        'health_status',
        'development_status',
        'has_open_follow_up',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'has_open_follow_up' => 'boolean',
    ];

    protected function firstName(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => is_null($value) ? null : mb_strtoupper(trim((string)$value), 'UTF-8')
        );
    }

    protected function middleName(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => (is_null($value) || trim((string)$value) === '') ? null : mb_strtoupper(trim((string)$value), 'UTF-8')
        );
    }

    protected function lastName(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => is_null($value) ? null : mb_strtoupper(trim((string)$value), 'UTF-8')
        );
    }

    protected function suffix(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => (is_null($value) || trim((string)$value) === '') ? null : mb_strtoupper(trim((string)$value), 'UTF-8')
        );
    }

    public function household(): BelongsTo
    {
        return $this->belongsTo(Household::class, 'household_id');
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class, 'barangay_id');
    }

    public function dayCareCenter(): BelongsTo
    {
        return $this->belongsTo(DayCareCenter::class, 'day_care_center_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'child_id', 'eccd_id');
    }

    public function healthMonitorings(): HasMany
    {
        return $this->hasMany(HealthMonitoring::class, 'child_id', 'eccd_id');
    }

    public function developmentAssessments(): HasMany
    {
        return $this->hasMany(DevelopmentAssessment::class, 'child_id', 'eccd_id');
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(FollowUp::class, 'child_id', 'eccd_id');
    }
}
