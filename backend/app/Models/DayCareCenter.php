<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DayCareCenter extends Model
{
    use HasFactory;

    protected $table = 'day_care_centers';

    protected $fillable = [
        'code',
        'name',
        'barangay_id',
        'address',
        'capacity',
        'enrolled_count',
        'status',
        'accreditation_level',
    ];

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class, 'barangay_id');
    }

    public function workers(): HasMany
    {
        return $this->hasMany(Worker::class, 'day_care_center_id');
    }

    public function enrolledChildren(): HasMany
    {
        return $this->hasMany(Child::class, 'day_care_center_id');
    }
}
