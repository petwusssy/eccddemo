<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Worker extends Model
{
    use HasFactory;

    protected $table = 'workers';

    protected $fillable = [
        'user_id',
        'role_id',
        'name',
        'role',
        'day_care_center_id',
        'barangay_id',
        'contact',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function roleModel(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function dayCareCenter(): BelongsTo
    {
        return $this->belongsTo(DayCareCenter::class, 'day_care_center_id');
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class, 'barangay_id');
    }

    public function mappingActivities(): BelongsToMany
    {
        return $this->belongsToMany(
            MappingActivity::class,
            'mapping_activity_workers',
            'worker_id',
            'mapping_activity_id'
        );
    }
}
