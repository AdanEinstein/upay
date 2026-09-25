# syntax=docker/dockerfile:1

# --- Stage 1: PHP deps + frontend assets ----------------------------------
# One stage because `pnpm run build` shells out to `php artisan wayfinder:generate`
# (@laravel/vite-plugin-wayfinder), so PHP + vendor/ must exist before the vite build.
FROM php:8.4-cli-alpine AS build
RUN apk add --no-cache nodejs npm git unzip \
    && npm install -g pnpm@10.30.3
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
# build-stage only: no .env here, so APP_ENV would default to production and
# AppServiceProvider's super-admin guard would abort package:discover/wayfinder.
ENV APP_ENV=local
COPY composer.json composer.lock package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist \
    && pnpm install --frozen-lockfile
COPY . .
RUN composer dump-autoload --no-dev --optimize

ARG VITE_APP_NAME
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME
ENV VITE_APP_NAME=$VITE_APP_NAME \
    VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY \
    VITE_REVERB_HOST=$VITE_REVERB_HOST \
    VITE_REVERB_PORT=$VITE_REVERB_PORT \
    VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME

RUN pnpm run build

# --- Stage 2: runtime (nginx + php-fpm, single image, role-driven) --------
FROM php:8.4-fpm-alpine

RUN apk add --no-cache nginx \
    && wget -qO /usr/local/bin/install-php-extensions \
        https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions \
    && chmod +x /usr/local/bin/install-php-extensions \
    && install-php-extensions pdo_pgsql pgsql pcntl opcache redis

WORKDIR /var/www/html

COPY . .
COPY --from=build /app/vendor ./vendor
COPY --from=build /app/public/build ./public/build

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/uploads.ini
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 80
ENTRYPOINT ["entrypoint.sh"]
