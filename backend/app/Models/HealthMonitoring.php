<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HealthMonitoring extends Model
{
    use HasFactory;

    protected $table = 'health_monitorings';

    protected $fillable = [
        'child_id',
        'date',
        'age_months',
        'height_cm',
        'weight_kg',
        'muac_cm',
        'nutritional_status',
        'opt_plus_class',
        'deworming_done',
        'vitamin_a_supplement',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'date' => 'date',
        'deworming_done' => 'boolean',
        'vitamin_a_supplement' => 'boolean',
        'height_cm' => 'decimal:2',
        'weight_kg' => 'decimal:2',
        'muac_cm' => 'decimal:1',
    ];

    public function child(): BelongsTo
    {
        return $this->belongsTo(Child::class, 'child_id', 'eccd_id');
    }
}
