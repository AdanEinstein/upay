<?php

namespace App\Providers;

use App\Auth\SuperAdminUserProvider;
use App\Models\Organization;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Registered here rather than in boot(): global route patterns are
        // baked into each route's where() clause the moment it is added to
        // the collection (Router::addWhereClausesToRoute), so this must run
        // before any provider's boot() registers routes — including
        // Fortify's, whose {organization}/logout would otherwise swallow
        // literal paths like /super-admin/logout ("super-admin" satisfies
        // the wildcard, and Fortify's routes are registered before ours).
        $reserved = implode('|', array_map(
            fn (string $slug): string => preg_quote($slug, '/'),
            Organization::RESERVED_SLUGS,
        ));

        Route::pattern('organization', "(?!(?:{$reserved})(?:/|$))[^/]+");
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureSearchMacros();
        $this->guardSuperAdminCredentials();

        Auth::provider('super_admin', fn () => new SuperAdminUserProvider);

        RateLimiter::for('super-admin-login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }

    /**
     * Refuse to boot in production without a real super admin password hash.
     */
    protected function guardSuperAdminCredentials(): void
    {
        if (! app()->isProduction()) {
            return;
        }

        $hash = config('super-admin.password_hash');

        if (! is_string($hash) || $hash === '') {
            throw new \RuntimeException(
                'SUPER_ADMIN_PASSWORD_HASH must be set to a bcrypt hash in production. '.
                'Generate one with: php artisan tinker --execute=\'echo Hash::make("your-password");\'',
            );
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Register the query builder macros used for text search across the app:
     * `searchText` (free-text/full-text search) and `whereLike` /
     * `orWhereLike` (substring search on anything not worth a tsvector
     * column — codes, short fields, etc).
     *
     * On PostgreSQL, `searchText` runs a full-text match against a
     * pre-built `tsvector` column (fast, uses the column's GIN index) when
     * a `$vectorColumn` is given. The search term is run through the same
     * `immutable_unaccent()` used to build that column, then through
     * `prefix_tsquery()` instead of Postgres's own `websearch_to_tsquery()`
     * so partial words still match (typing "serv" finds "servidor") —
     * Laravel's built-in `whereFullText()` has no hook for either of those,
     * so this bypasses it and builds the `@@` expression directly. The
     * regconfig passed to both functions is resolved from the active app
     * locale via `config('search.languages')`, so the same macro works
     * across every locale the app supports. On every other driver —
     * notably SQLite, which all local/testing environments run — it falls
     * back to `LIKE` across `$likeColumns`.
     *
     * PostgreSQL's `LIKE` is case-sensitive; SQLite's isn't. `whereLike` /
     * `orWhereLike` paper over that by using `ILIKE` on PostgreSQL so
     * search behaves the same regardless of environment.
     */
    protected function configureSearchMacros(): void
    {
        $likeOperator = fn (Builder $query): string => $query->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

        Builder::macro('whereLike', function (string $column, string $pattern) use ($likeOperator) {
            /** @var Builder $this */
            return $this->where($column, $likeOperator($this), $pattern);
        });

        Builder::macro('orWhereLike', function (string $column, string $pattern) use ($likeOperator) {
            /** @var Builder $this */
            return $this->orWhere($column, $likeOperator($this), $pattern);
        });

        Builder::macro('searchText', function (array $likeColumns, string $term, ?string $vectorColumn = null) use ($likeOperator) {
            /** @var Builder $this */
            $usePostgresFullText = $vectorColumn !== null && $this->getConnection()->getDriverName() === 'pgsql';

            return $this->where(function (Builder $query) use ($likeColumns, $term, $vectorColumn, $usePostgresFullText, $likeOperator) {
                if ($usePostgresFullText) {
                    $language = config('search.languages.'.app()->getLocale(), config('search.default_language'));

                    $query->whereRaw(
                        "{$vectorColumn} @@ prefix_tsquery('{$language}', immutable_unaccent(?))",
                        [$term],
                    );

                    return;
                }

                $operator = $likeOperator($query);

                foreach ($likeColumns as $column) {
                    $query->orWhere($column, $operator, "%{$term}%");
                }
            });
        });
    }
}
