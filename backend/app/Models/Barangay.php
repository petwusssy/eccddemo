<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Barangay extends Model
{
    use HasFactory;

    protected $table = 'barangays';

    protected $fillable = [
        'code',
        'name',
        'district',
        'city',
        'under5_population',
        'target_children',
    ];

    public function households(): HasMany
    {
        return $this->hasMany(Household::class, 'barangay_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Child::class, 'barangay_id');
    }

    public function dayCareCenters(): HasMany
    {
        return $this->hasMany(DayCareCenter::class, 'barangay_id');
    }
}
