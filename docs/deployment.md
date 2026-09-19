# Deployment

No deploy workflow is committed to this template — infrastructure differs per client/project, and a wrong default is worse than none.

## Recommended default: Laravel Cloud

For most projects built on this template, [Laravel Cloud](https://cloud.laravel.com) is the fastest path to production: it builds from the repo, runs migrations, and handles the queue/scheduler/Reverb processes without custom CI/CD. Connect the repo in the Cloud dashboard and set the environment variables from `.env.example` (including `SUPER_ADMIN_*` and the mail/queue drivers).

## Rolling your own

If the target infra needs a custom pipeline (own servers, a different PaaS, etc.), add a `.github/workflows/deploy-*.yml` for it — this is genuinely project-specific and not something the template should guess at. At minimum it needs to:

1. Build the frontend (`pnpm install && pnpm run build`).
2. Install PHP dependencies without dev packages (`composer install --no-dev --optimize-autoloader`).
3. Run migrations (`php artisan migrate --force`).
4. Restart the queue workers and, if used, `php artisan reverb:restart`.

## Checklist before the first deploy

- [ ] `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` set to real values (not the `.env.example` defaults)
- [ ] `APP_KEY` generated for the target environment (`php artisan key:generate`)
- [ ] Storage disk configured for organization logo/favicon uploads (`php artisan storage:link` for local disk, or S3 credentials)
- [ ] Mail driver configured (password reset emails need a real mailer, not `log`)
- [ ] At least one `Organization` seeded, created via the super-admin area at `/super-admin`
