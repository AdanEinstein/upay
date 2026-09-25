<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Support\AppIcon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * Web app manifest and icons per organization, so the installed app carries
 * the store's brand colors. Public on purpose: browsers fetch the manifest and
 * its icons without cookies.
 */
class AppManifestController extends Controller
{
    public function manifest(Organization $organization): JsonResponse
    {
        $icon = new AppIcon($organization);

        $icons = collect(['192', '512', 'maskable'])->map(fn (string $variant): array => [
            'src' => route('app-icon', ['organization' => $organization->slug, 'variant' => $variant, 'v' => $icon->version()]),
            'sizes' => AppIcon::VARIANTS[$variant]['size'].'x'.AppIcon::VARIANTS[$variant]['size'],
            'type' => 'image/png',
            'purpose' => AppIcon::VARIANTS[$variant]['purpose'],
        ]);

        return response()->json([
            'id' => route('dashboard', ['organization' => $organization->slug], false),
            'name' => 'Upay',
            'short_name' => 'Upay',
            'start_url' => route('dashboard', ['organization' => $organization->slug], false),
            'display' => 'standalone',
            'lang' => 'pt-BR',
            'background_color' => $icon->background(),
            'theme_color' => $icon->background(),
            'icons' => $icons->all(),
        ], options: JSON_UNESCAPED_SLASHES)->header('Content-Type', 'application/manifest+json');
    }

    public function icon(Organization $organization, string $variant): Response
    {
        return response((new AppIcon($organization))->png($variant), headers: [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
