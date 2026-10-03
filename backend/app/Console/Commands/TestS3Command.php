<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class TestS3Command extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 's3:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Upload a 1-byte test file to verify AWS S3 bucket and prefix write permissions.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $bucket = config('filesystems.disks.s3.bucket');
        $region = config('filesystems.disks.s3.region');
        $prefix = config('filesystems.disks.s3.root');

        $this->info("Verifying AWS S3 Configuration...");
        $this->table(
            ['Key', 'Value'],
            [
                ['Bucket', $bucket ?: '<EMPTY>'],
                ['Region', $region ?: '<EMPTY>'],
                ['Prefix (Root)', $prefix ?: '<NONE>'],
            ]
        );

        if (empty($bucket)) {
            $this->error("AWS_BUCKET is not set in your .env file!");
            return Command::FAILURE;
        }

        $filename = 'healthcheck/cli-test-' . time() . '.txt';
        $this->line("Attempting to write 1-byte file to [{$filename}] on 's3' disk...");

        try {
            $start = microtime(true);
            $saved = Storage::disk('s3')->put($filename, '1');
            $ms = round((microtime(true) - $start) * 1000, 2);

            if (!$saved) {
                $this->error("Failed to write to S3: put() returned false.");
                return Command::FAILURE;
            }

            $url = Storage::disk('s3')->url($filename);
            $this->info("SUCCESS! 1-byte test file written to AWS S3 in {$ms}ms.");
            $this->line("Public URL: {$url}");
            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("S3 Error: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
