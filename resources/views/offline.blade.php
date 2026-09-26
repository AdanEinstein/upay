<!DOCTYPE html>
<html
    lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    @class(['dark' => ($appearance ?? 'system') == 'dark', 'light' => ($appearance ?? 'system') == 'light'])
    style="--tenant-primary: {{ $background }}; --tenant-on-primary: {{ $foreground }}"
>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="{{ $background }}">
        <title>{{ __('No connection') }}</title>

        {{-- Mirrors the tokens in resources/css/app.css; nothing from the build can be fetched offline. --}}
        <style>
            :root {
                --background: oklch(1 0 0);
                --foreground: oklch(0.147 0.004 49.3);
                --muted: oklch(0.96 0.002 17.2);
                --muted-foreground: oklch(0.547 0.021 43.1);
                --radius: 0.625rem;
                color-scheme: light;
            }

            html.dark {
                --background: oklch(0.147 0.004 49.3);
                --foreground: oklch(0.986 0.002 67.8);
                --muted: oklch(0.268 0.011 36.5);
                --muted-foreground: oklch(0.714 0.014 41.2);
                color-scheme: dark;
            }

            @media (prefers-color-scheme: dark) {
                html:not(.light) {
                    --background: oklch(0.147 0.004 49.3);
                    --foreground: oklch(0.986 0.002 67.8);
                    --muted: oklch(0.268 0.011 36.5);
                    --muted-foreground: oklch(0.714 0.014 41.2);
                    color-scheme: dark;
                }
            }

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                min-height: 100dvh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                padding: 2rem 1.5rem;
                text-align: center;
                background: var(--background);
                color: var(--foreground);
                font-family: 'Outfit Variable', system-ui, sans-serif;
                -webkit-font-smoothing: antialiased;
            }

            /* The brand mark loses its color while offline and gets it back on reconnect. */
            .mark {
                width: 88px;
                height: 88px;
                border-radius: 22px;
                filter: grayscale(1);
                opacity: 0.45;
                transition: filter 500ms ease, opacity 500ms ease;
            }

            [data-online] .mark {
                filter: none;
                opacity: 1;
            }

            .status {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0.5rem;
                padding: 0.375rem 0.75rem;
                border-radius: 999px;
                background: var(--muted);
                color: var(--muted-foreground);
                font-size: 0.75rem;
                font-weight: 500;
                transition: background 500ms ease, color 500ms ease;
            }

            .status::before {
                content: '';
                width: 0.5rem;
                height: 0.5rem;
                border-radius: 50%;
                background: currentColor;
                animation: breathe 1.6s ease-in-out infinite;
            }

            [data-online] .status {
                background: var(--tenant-primary);
                color: var(--tenant-on-primary);
            }

            [data-online] .status::before {
                animation: none;
            }

            @keyframes breathe {
                50% {
                    opacity: 0.25;
                }
            }

            h1 {
                margin: 0;
                font-family: 'Raleway Variable', system-ui, sans-serif;
                font-size: 1.25rem;
                font-weight: 700;
            }

            p {
                margin: 0;
                max-width: 20rem;
                color: var(--muted-foreground);
                font-size: 0.875rem;
                line-height: 1.5;
            }

            button {
                width: 100%;
                max-width: 20rem;
                height: 3rem;
                margin-top: 0.5rem;
                border: 0;
                border-radius: var(--radius);
                background: var(--tenant-primary);
                color: var(--tenant-on-primary);
                font: inherit;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
            }

            button:focus-visible {
                outline: 2px solid var(--tenant-primary);
                outline-offset: 3px;
            }

            @media (prefers-reduced-motion: reduce) {
                *,
                *::before {
                    animation: none !important;
                    transition: none !important;
                }
            }
        </style>
    </head>
    <body>
        <img class="mark" src="{{ $iconDataUri }}" alt="" width="88" height="88">

        <span class="status" role="status" data-reconnected="{{ __('Back online, reloading') }}">{{ __('Waiting for connection') }}</span>

        <h1>{{ __("You're offline") }}</h1>
        <p>{{ __('Check your Wi-Fi or mobile data. This screen reloads on its own once you are back online.') }}</p>

        <button type="button" id="retry">{{ __('Try again') }}</button>

        <script nonce="{{ \Illuminate\Support\Facades\Vite::cspNonce() }}">
            (function () {
                const status = document.querySelector('.status');

                document.getElementById('retry').addEventListener('click', () => location.reload());

                window.addEventListener('online', () => {
                    document.body.dataset.online = '';
                    status.textContent = status.dataset.reconnected;
                    setTimeout(() => location.reload(), 700);
                });
            })();
        </script>
    </body>
</html>
