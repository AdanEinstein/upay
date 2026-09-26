@php
    $tenant = \App\Support\Tenant::current();
    $isHexColor = fn (?string $value) => $value && preg_match('/^#[0-9a-fA-F]{6}$/', $value);
@endphp
<!DOCTYPE html>
<html
    lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    translate="no"
    @class(['dark' => ($appearance ?? 'system') == 'dark'])
    @if ($tenant)
        style="{{ collect([
            'primary' => $tenant->accent_color,
            'primary-hover' => $tenant->accent_color_hover,
            'primary-soft' => $tenant->accent_color_soft,
            'on-primary' => $tenant->on_primary_color,
        ])->filter($isHexColor)->map(fn ($value, $key) => "--tenant-{$key}:{$value}")->implode(';') }}"
    @endif
>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content">
        <meta name="google" content="notranslate">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script nonce="{{ \Illuminate\Support\Facades\Vite::cspNonce() }}">
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }

            /* Splash: painted by the server so it shows while the app's code loads, removed by app.tsx once it mounts. */
            #splash {
                position: fixed;
                inset: 0;
                z-index: 100;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 18px;
                background: var(--tenant-primary, #3667f6);
                color: var(--tenant-on-primary, #ffffff);
            }

            #splash .splash-logo {
                width: 64px;
                height: 64px;
                background: currentColor;
                mask: url('/logo-mark.png') center / contain no-repeat;
                -webkit-mask: url('/logo-mark.png') center / contain no-repeat;
            }

            #splash .splash-name {
                font-family: 'Raleway Variable', sans-serif;
                font-weight: 700;
                font-size: 24px;
            }

            #splash .splash-spinner {
                position: absolute;
                bottom: calc(64px + env(safe-area-inset-bottom));
                width: 24px;
                height: 24px;
                animation: splash-spin 1s linear infinite;
            }

            @media (min-width: 1024px) {
                #splash .splash-logo {
                    width: 72px;
                    height: 72px;
                }

                #splash .splash-name {
                    font-size: 30px;
                }

                #splash .splash-spinner {
                    position: static;
                    margin-top: 8px;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                #splash .splash-spinner {
                    animation: none;
                }
            }

            @keyframes splash-spin {
                to {
                    transform: rotate(360deg);
                }
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="64x64">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        @if ($tenant)
            <link rel="apple-touch-icon" href="{{ route('app-icon', ['organization' => $tenant->slug, 'variant' => 'apple', 'v' => (new \App\Support\AppIcon($tenant))->version()]) }}">
            <link rel="manifest" href="{{ route('app-manifest', ['organization' => $tenant->slug]) }}">
        @else
            <link rel="apple-touch-icon" href="/apple-touch-icon.png">
            <link rel="manifest" href="/manifest.webmanifest">
        @endif
        <meta name="theme-color" content="{{ $isHexColor($tenant?->accent_color) ? $tenant->accent_color : '#3667f6' }}">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />

        <div id="splash">
            <span class="splash-logo" aria-hidden="true"></span>
            <span class="splash-name">{{ config('app.name') }}</span>
            <svg class="splash-spinner" role="status" aria-label="{{ __('Loading') }}" viewBox="0 0 256 256" fill="currentColor">
                <path d="M136,32V64a8,8,0,0,1-16,0V32a8,8,0,0,1,16,0Zm88,88H192a8,8,0,0,0,0,16h32a8,8,0,0,0,0-16Zm-45.09,47.6a8,8,0,0,0-11.31,11.31l22.62,22.63a8,8,0,0,0,11.32-11.32ZM128,184a8,8,0,0,0-8,8v32a8,8,0,0,0,16,0V192A8,8,0,0,0,128,184ZM77.09,167.6,54.46,190.22a8,8,0,0,0,11.32,11.32L88.4,178.91A8,8,0,0,0,77.09,167.6ZM72,128a8,8,0,0,0-8-8H32a8,8,0,0,0,0,16H64A8,8,0,0,0,72,128ZM65.78,54.46A8,8,0,0,0,54.46,65.78L77.09,88.4A8,8,0,0,0,88.4,77.09Z"/>
            </svg>
        </div>
    </body>
</html>
