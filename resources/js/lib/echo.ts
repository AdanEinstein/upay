import { configureEcho } from '@laravel/echo-react';
import type { ChannelAuthorizationCallback } from 'pusher-js';

// Real-time is optional: without a Reverb key the app just skips the socket.
export const echoEnabled = Boolean(import.meta.env.VITE_REVERB_APP_KEY);

// The app has no <meta name="csrf-token">, and a token baked in at boot would go
// stale after login, so read the XSRF cookie fresh on every channel authorization.
export function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);

    return match ? decodeURIComponent(match[1]) : '';
}

if (echoEnabled) {
    configureEcho({
        broadcaster: 'reverb',
        authorizer: (channel: { name: string }) => ({
            authorize: (
                socketId: string,
                callback: ChannelAuthorizationCallback,
            ) => {
                fetch('/broadcasting/auth', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': xsrfToken(),
                    },
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name,
                    }),
                })
                    .then((response) =>
                        response.ok
                            ? response.json()
                            : Promise.reject(
                                  new Error(String(response.status)),
                              ),
                    )
                    .then((data) => callback(null, data))
                    .catch((error: Error) => callback(error, null));
            },
        }),
    });
}
