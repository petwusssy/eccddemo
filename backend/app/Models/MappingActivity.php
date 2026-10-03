<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MappingActivity extends Model
{
    use HasFactory;

    protected $table = 'mapping_activities';

    protected $fillable = [
        'code',
        'name',
        'year',
        'start_date',
        'end_date',
        'target_households',
        'mapped_households',
        'children_identified',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function assignedWorkers(): BelongsToMany
    {
        return $this->belongsToMany(
            Worker::class,
            'mapping_activity_workers',
            'mapping_activity_id',
            'worker_id'
        );
    }

    public function households(): HasMany
    {
        return $this->hasMany(Household::class, 'mapping_activity_id');
    }
}
