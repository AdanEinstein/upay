<?php

use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function paletteColor(string $png, int $index): string
{
    return '#'.bin2hex(substr($png, strpos($png, 'PLTE') + 4 + $index * 3, 3));
}

test('the manifest carries the organization brand color without requiring a login', function () {
    $organization = Organization::factory()->create(['accent_color' => '#16a34a']);

    $response = $this->get(route('app-manifest', ['organization' => $organization->slug]));

    $response->assertOk()
        ->assertHeader('Content-Type', 'application/manifest+json')
        ->assertJsonPath('theme_color', '#16a34a')
        ->assertJsonPath('background_color', '#16a34a')
        ->assertJsonPath('start_url', "/{$organization->slug}/dashboard")
        ->assertJsonPath('scope', "/{$organization->slug}/")
        ->assertJsonCount(3, 'icons')
        ->assertJsonPath('icons.2.purpose', 'maskable');

    expect($response->json('icons.0.src'))->toStartWith(route('app-icon', ['organization' => $organization->slug, 'variant' => '192']));
});

test('the icon is painted with the organization accent and on-primary colors', function (string $variant, int $size) {
    $organization = Organization::factory()->create(['accent_color' => '#db2777', 'on_primary_color' => '#111111']);

    $response = $this->get(route('app-icon', ['organization' => $organization->slug, 'variant' => $variant]));

    $response->assertOk()->assertHeader('Content-Type', 'image/png');
    $png = $response->getContent();

    expect(getimagesizefromstring($png))->toMatchArray([0 => $size, 1 => $size])
        ->and(paletteColor($png, 0))->toBe('#db2777')
        ->and(paletteColor($png, 199))->toBe('#111111')
        ->and(substr($png, strpos($png, 'PLTE') + 772, 4))->toBe(pack('N', crc32(substr($png, strpos($png, 'PLTE'), 772))));
})->with([
    ['192', 192],
    ['512', 512],
    ['maskable', 512],
    ['apple', 180],
]);

test('changing the brand color changes the icon urls so cached icons are not reused', function () {
    $organization = Organization::factory()->create(['accent_color' => '#3667f6']);
    $manifest = fn () => $this->get(route('app-manifest', ['organization' => $organization->slug]))->json('icons.0.src');

    $before = $manifest();
    $organization->update(['accent_color' => '#ea580c']);

    expect($manifest())->not->toBe($before);
});

test('unknown organizations and icon variants are not found', function () {
    $organization = Organization::factory()->create();

    $this->get("/{$organization->slug}/app-icon/1024")->assertNotFound();
    $this->get('/no-such-store/manifest.webmanifest')->assertNotFound();
});

test('only tenant pages link a manifest, so the app always installs scoped to an organization', function () {
    $organization = Organization::factory()->create();

    $this->get(route('login', ['organization' => $organization->slug]))
        ->assertSee('href="'.route('app-manifest', ['organization' => $organization->slug]).'"', false);

    $this->get(route('home'))->assertDontSee('rel="manifest"', false);
    $this->get(route('register'))->assertDontSee('rel="manifest"', false);
});

test('the offline page is branded with the organization colors without requiring a login', function () {
    $organization = Organization::factory()->create(['accent_color' => '#16a34a', 'on_primary_color' => '#111111']);

    $this->get(route('app-offline', ['organization' => $organization->slug]))
        ->assertOk()
        ->assertSee('--tenant-primary: #16a34a; --tenant-on-primary: #111111', false)
        ->assertSee('data:image/png;base64,', false)
        ->assertSee('Você está sem internet');
});
