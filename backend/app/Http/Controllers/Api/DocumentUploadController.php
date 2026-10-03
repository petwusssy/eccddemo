<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentUploadController extends Controller
{
    /**
     * POST /api/upload-s3
     * Uploads child document attachment (photo, scanned form, immunization record, PDF)
     * Validates file types (jpg, png, pdf) and max size (5MB).
     */
    public function upload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'child_id' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:255',
        ]);

        try {
            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $mimeType = $file->getMimeType();
            $fileSize = $file->getSize();

            // S3 folder structure: e.g. "documents/{category}/{uuid}.{ext}"
            $category = $request->input('category', 'general');
            $safeCategory = Str::slug($category);
            $fileName = Str::uuid() . '.' . $extension;
            $destinationDir = "documents/{$safeCategory}";

            // Store to S3 disk (prefix bound in config/filesystems.php 'root')
            $path = Storage::disk('s3')->putFileAs($destinationDir, $file, $fileName);

            // Generate accessible URL
            $url = Storage::disk('s3')->url($path);

            return response()->json([
                'ok' => true,
                'status' => 201,
                'message' => 'Document successfully uploaded to AWS S3.',
                'data' => [
                    'url' => $url,
                    'path' => $path,
                    'filename' => $originalName,
                    'stored_filename' => $fileName,
                    'extension' => $extension,
                    'mime_type' => $mimeType,
                    'size_bytes' => $fileSize,
                    'child_id' => $request->input('child_id'),
                    'category' => $category,
                    'description' => $request->input('description'),
                    's3_bucket' => config('filesystems.disks.s3.bucket'),
                    's3_prefix' => config('filesystems.disks.s3.root'),
                    'uploaded_at' => now()->toIso8601String(),
                ],
            ], 201);
        } catch (\Throwable $e) {
            Log::error('S3 Upload Error: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'ok' => false,
                'status' => 500,
                'error' => 'Failed to upload document to AWS S3: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/test-s3
     * Direct healthcheck endpoint to verify AWS S3 credentials and prefix write permissions immediately.
     */
    public function testS3(): JsonResponse
    {
        $testFileName = 'healthcheck/test-s3-' . time() . '.txt';
        $content = '1';

        try {
            $bucket = config('filesystems.disks.s3.bucket');
            $region = config('filesystems.disks.s3.region');
            $prefix = config('filesystems.disks.s3.root');

            if (empty($bucket)) {
                return response()->json([
                    'ok' => false,
                    'status' => 400,
                    'message' => 'AWS S3 is not configured: AWS_BUCKET is empty in backend/.env',
                    'config' => [
                        'bucket' => $bucket,
                        'region' => $region,
                        'prefix' => $prefix,
                    ],
                ], 400);
            }

            // Write 1-byte test file
            $startTime = microtime(true);
            $written = Storage::disk('s3')->put($testFileName, $content);
            $durationMs = round((microtime(true) - $startTime) * 1000, 2);

            if (!$written) {
                return response()->json([
                    'ok' => false,
                    'status' => 500,
                    'message' => 'S3 driver returned false when attempting to write test file.',
                ], 500);
            }

            $url = Storage::disk('s3')->url($testFileName);
            $exists = Storage::disk('s3')->exists($testFileName);

            return response()->json([
                'ok' => true,
                'status' => 200,
                'message' => 'AWS S3 connection and write permission verified successfully!',
                'data' => [
                    'bucket' => $bucket,
                    'region' => $region,
                    'prefix' => $prefix,
                    'test_file_path' => $testFileName,
                    'test_file_url' => $url,
                    'verified_exists' => $exists,
                    'latency_ms' => $durationMs,
                    'timestamp' => now()->toIso8601String(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('S3 Connection Test Failed: ' . $e->getMessage());

            return response()->json([
                'ok' => false,
                'status' => 500,
                'message' => 'AWS S3 connection failed: ' . $e->getMessage(),
                'error_detail' => [
                    'class' => get_class($e),
                    'code' => $e->getCode(),
                ],
            ], 500);
        }
    }
}
