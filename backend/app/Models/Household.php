<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Household extends Model
{
    use HasFactory;

    protected $table = 'households';

    protected $fillable = [
        'household_no',
        'mapping_activity_id',
        'barangay_id',
        'purok',
        'address',
        'parent_guardian',
        'contact_number',
        'is_4ps',
        'is_ip',
        'monthly_income_class',
        'mapped_date',
        'mapped_by',
    ];

    protected $casts = [
        'is_4ps' => 'boolean',
        'is_ip' => 'boolean',
        'mapped_date' => 'date',
    ];

    public function children(): HasMany
    {
        return $this->hasMany(Child::class, 'household_id');
    }

    public function barangay(): BelongsTo
    {
        return $this->belongsTo(Barangay::class, 'barangay_id');
    }

    public function mappingActivity(): BelongsTo
    {
        return $this->belongsTo(MappingActivity::class, 'mapping_activity_id');
    }
}
