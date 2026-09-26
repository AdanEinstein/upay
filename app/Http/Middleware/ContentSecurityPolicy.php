<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class ContentSecurityPolicy
{
    /**
     * Lock scripts to same-origin + a per-request nonce (Vite tags pick it up
     * automatically; inline Blade scripts must use Vite::cspNonce()).
     */
    public function handle(Request $request, Closure $next): Response
    {
        // ponytail: Pulse is Livewire/Alpine (needs unsafe-eval) and super-admin only, so it runs without CSP.
        if ($request->is(trim((string) config('pulse.path'), '/').'*')) {
            return $next($request);
        }

        $nonce = Vite::useCspNonce();

        $response = $next($request);

        if (! $response->headers->has('Content-Security-Policy')) {
            $response->headers->set('Content-Security-Policy', $this->policy($nonce));
        }

        return $response;
    }

    private function policy(string $nonce): string
    {
        $hot = Vite::isRunningHot() ? rtrim((string) file_get_contents(Vite::hotFile())) : null;
        $hotSocket = $hot ? preg_replace('#^http#', 'ws', $hot) : null;

        $directives = [
            'default-src' => ["'self'"],
            'script-src' => ["'self'", "'nonce-{$nonce}'", $hot],
            // ponytail: inline styles allowed on purpose -- sonner/Radix inject <style> at runtime and
            // <html> carries the tenant colors in a style attribute. Scripts are what XSS needs, and those are nonce-locked.
            'style-src' => ["'self'", "'unsafe-inline'", $hot],
            'img-src' => ["'self'", 'data:', 'blob:', $this->origin(Storage::disk('public')->url(''))],
            'font-src' => ["'self'", 'data:', $hot],
            'connect-src' => ["'self'", $this->reverbOrigin(), $hot, $hotSocket],
            'frame-ancestors' => ["'self'"],
            'base-uri' => ["'self'"],
            'form-action' => ["'self'"],
            'object-src' => ["'none'"],
        ];

        return collect($directives)
            ->map(fn (array $sources, string $name) => $name.' '.implode(' ', array_unique(array_filter($sources))))
            ->implode('; ');
    }

    /**
     * The websocket origin the browser's Echo client connects to.
     */
    private function reverbOrigin(): ?string
    {
        $options = config('reverb.apps.apps.0.options', []);

        if (empty($options['host'])) {
            return null;
        }

        $scheme = ($options['scheme'] ?? 'https') === 'https' ? 'wss' : 'ws';

        return "{$scheme}://{$options['host']}:{$options['port']}";
    }

    private function origin(string $url): ?string
    {
        $parts = parse_url($url);

        if (empty($parts['scheme']) || empty($parts['host'])) {
            return null;
        }

        return $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');
    }
}
