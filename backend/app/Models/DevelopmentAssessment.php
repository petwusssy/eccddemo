<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DevelopmentAssessment extends Model
{
    use HasFactory;

    protected $table = 'development_assessments';

    protected $fillable = [
        'child_id',
        'assessment_date',
        'assessment_type',
        'tool_version',
        'status',
        'examiner_id',
        'examiner_name',
        'standard_score',
        'scaled_scores',
        'interpretation',
        'notes',
    ];

    protected $casts = [
        'assessment_date' => 'date',
        'scaled_scores' => 'array',
    ];

    public function child(): BelongsTo
    {
        return $this->belongsTo(Child::class, 'child_id', 'eccd_id');
    }
}
