#!/bin/sh
set -e

ROLE="${APP_ROLE:-app}"

case "$ROLE" in
  app)
    php artisan migrate --force
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan storage:link || true
    # the storage volume is created root-owned on first mount
    chown -R www-data:www-data storage/app
    # ponytail: no supervisord. nginx runs in the background, php-fpm is PID 1 —
    # if php-fpm dies the container exits and `restart: unless-stopped` brings
    # both back. A lone nginx crash only self-heals via the healthcheck restart.
    nginx -g "daemon off;" &
    exec php-fpm -F
    ;;
  queue)
    exec php artisan queue:work --tries=3 --max-time=3600 --sleep=3
    ;;
  reverb)
    exec php artisan reverb:start --host=0.0.0.0 --port=8080
    ;;
  scheduler)
    # ponytail: 60s poll loop instead of cron/supercronic, enough for daily jobs
    while true; do
      php artisan schedule:run --no-interaction
      sleep 60
    done
    ;;
  *)
    echo "Unknown APP_ROLE: $ROLE" >&2
    exit 1
    ;;
esac
