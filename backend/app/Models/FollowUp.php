<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FollowUp extends Model
{
    use HasFactory;

    protected $table = 'follow_ups';

    protected $fillable = [
        'child_id',
        'source_module',
        'reason',
        'priority',
        'status',
        'assigned_worker_id',
        'scheduled_date',
        'completed_date',
        'action_type',
        'action_plan',
        'action_taken',
        'remarks',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'completed_date' => 'date',
    ];

    public function child(): BelongsTo
    {
        return $this->belongsTo(Child::class, 'child_id', 'eccd_id');
    }

    public function assignedWorker(): BelongsTo
    {
        return $this->belongsTo(Worker::class, 'assigned_worker_id');
    }
}
