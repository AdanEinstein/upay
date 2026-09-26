<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Support\AppIcon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\View\View;

/**
 * Web app manifest, icons and offline page per organization, so the installed
 * app carries the store's brand colors. Public on purpose: browsers fetch the
 * manifest and its icons without cookies, and the service worker caches the
 * offline page whatever the session state. The app is scoped to the
 * organization's path, so the welcome page and other stores open outside it.
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
            'scope' => "/{$organization->slug}/",
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

    /**
     * Shown by public/sw.js when a navigation fails for lack of connection.
     * Self-contained (inline icon and styles) because nothing else can load offline.
     */
    public function offline(Organization $organization): View
    {
        $icon = new AppIcon($organization);

        return view('offline', [
            'background' => $icon->background(),
            'foreground' => $icon->foreground(),
            'iconDataUri' => 'data:image/png;base64,'.base64_encode($icon->png('192')),
        ]);
    }
}
