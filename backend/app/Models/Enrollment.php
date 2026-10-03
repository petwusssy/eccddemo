<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    use HasFactory;

    protected $table = 'enrollments';

    protected $fillable = [
        'child_id',
        'day_care_center_id',
        'barangay_id',
        'school_year',
        'program',
        'session',
        'enrollment_date',
        'status',
        'worker_id',
        'remarks',
    ];

    protected $casts = [
        'enrollment_date' => 'date',
    ];

    public function child(): BelongsTo
    {
        return $this->belongsTo(Child::class, 'child_id', 'eccd_id');
    }

    public function dayCareCenter(): BelongsTo
    {
        return $this->belongsTo(DayCareCenter::class, 'day_care_center_id');
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class, 'barangay_id');
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(Worker::class, 'worker_id');
    }
}
