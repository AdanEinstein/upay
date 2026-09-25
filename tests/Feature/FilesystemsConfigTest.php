<?php

/**
 * @param  array<string, string>  $env
 * @return array<string, mixed>
 */
function filesystemDisksWith(array $env): array
{
    foreach ($env as $key => $value) {
        $_ENV[$key] = $_SERVER[$key] = $value;
    }

    try {
        return (require config_path('filesystems.php'))['disks'];
    } finally {
        foreach (array_keys($env) as $key) {
            unset($_ENV[$key], $_SERVER[$key]);
        }
    }
}

test('upload disks stay local when no supabase bucket is configured', function () {
    $disks = filesystemDisksWith([]);

    expect($disks['public']['driver'])->toBe('local')
        ->and($disks['local']['driver'])->toBe('local');
});

test('upload disks switch to supabase storage when buckets are configured', function () {
    $disks = filesystemDisksWith([
        'SUPABASE_URL' => 'https://ref.supabase.co/',
        'SUPABASE_PUBLIC_BUCKET' => 'upay-public',
        'SUPABASE_PRIVATE_BUCKET' => 'upay-private',
    ]);

    expect($disks['public'])->toMatchArray([
        'driver' => 's3',
        'bucket' => 'upay-public',
        'url' => 'https://ref.supabase.co/storage/v1/object/public/upay-public',
    ])->and($disks['local'])->toMatchArray([
        'driver' => 's3',
        'bucket' => 'upay-private',
    ])->and($disks['local'])->not->toHaveKey('url');
});
