<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    use HasFactory;

    protected $table = 'resources';

    protected $fillable = [
        'title',
        'category',
        'code',
        'form_number',
        'description',
        'status',
        'official_doc_placeholder',
        'file_type',
        'last_updated',
    ];

    protected $casts = [
        'last_updated' => 'date',
    ];
}
