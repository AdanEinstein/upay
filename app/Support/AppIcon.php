<?php

namespace App\Support;

use App\Models\Organization;

/**
 * Installed-app (PWA) icons painted with an organization's brand colors.
 *
 * The templates in resources/icons are palette PNGs of the logo mark in which
 * each index encodes a fixed blend instead of a color: indices 0-199 go from
 * the background (0) to the foreground (199), and indices 200-255 are the
 * background at increasing opacity (the anti-aliased rounded corners). Painting
 * an icon only rewrites the PLTE chunk, so no image extension is needed.
 */
class AppIcon
{
    /**
     * @var array<int|string, array{file: string, size: int, purpose: string}> Keyed by the URL segment ("192" and "512" become int keys).
     */
    public const array VARIANTS = [
        '192' => ['file' => 'app-icon-192.png', 'size' => 192, 'purpose' => 'any'],
        '512' => ['file' => 'app-icon-512.png', 'size' => 512, 'purpose' => 'any'],
        'maskable' => ['file' => 'app-icon-maskable.png', 'size' => 512, 'purpose' => 'maskable'],
        'apple' => ['file' => 'app-icon-apple.png', 'size' => 180, 'purpose' => 'any'],
    ];

    /**
     * Bump when the templates change, so browsers drop icons cached under the old URL.
     */
    private const int REVISION = 1;

    private const int BLEND_LEVELS = 200;

    public function __construct(public Organization $organization) {}

    public function background(): string
    {
        return $this->colorOrDefault($this->organization->accent_color, 'accent_color');
    }

    public function foreground(): string
    {
        return $this->colorOrDefault($this->organization->on_primary_color, 'on_primary_color');
    }

    /**
     * Changes whenever the icon would, so icon URLs can be cached forever.
     */
    public function version(): string
    {
        return substr(md5(self::REVISION.$this->background().$this->foreground()), 0, 10);
    }

    public function png(string $variant): string
    {
        $template = (string) file_get_contents(resource_path('icons/'.self::VARIANTS[$variant]['file']));

        $offset = (int) strpos($template, 'PLTE') - 4;
        $length = (int) hexdec(bin2hex(substr($template, $offset, 4)));
        $palette = $this->palette(intdiv($length, 3));
        $chunk = pack('N', $length).'PLTE'.$palette.pack('N', crc32('PLTE'.$palette));

        return substr_replace($template, $chunk, $offset, 12 + $length);
    }

    private function palette(int $entries): string
    {
        [$background, $foreground] = [$this->rgb($this->background()), $this->rgb($this->foreground())];
        $palette = '';

        for ($index = 0; $index < $entries; $index++) {
            $blend = $index < self::BLEND_LEVELS ? $index / (self::BLEND_LEVELS - 1) : 0;

            foreach ([0, 1, 2] as $channel) {
                $palette .= chr((int) round($background[$channel] + ($foreground[$channel] - $background[$channel]) * $blend));
            }
        }

        return $palette;
    }

    /**
     * @return array{int, int, int}
     */
    private function rgb(string $hex): array
    {
        return [(int) hexdec(substr($hex, 1, 2)), (int) hexdec(substr($hex, 3, 2)), (int) hexdec(substr($hex, 5, 2))];
    }

    private function colorOrDefault(?string $value, string $column): string
    {
        return $value && preg_match('/^#[0-9a-fA-F]{6}$/', $value) ? $value : Organization::DEFAULT_COLORS[$column];
    }
}
