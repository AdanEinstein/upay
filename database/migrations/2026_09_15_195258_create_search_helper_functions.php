<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Creates the PostgreSQL helper functions used by the `searchText` query
     * builder macro (see App\Providers\AppServiceProvider):
     *
     * - `immutable_unaccent(text)`: wraps Postgres's built-in `unaccent()`,
     *   which is only STABLE, as IMMUTABLE. A `GENERATED ALWAYS AS` column
     *   (the `search_vector` column a domain model adds when it opts into
     *   full-text search) requires every function in its expression to be
     *   IMMUTABLE.
     * - `prefix_tsquery(regconfig, text)`: turns a search term into a
     *   tsquery that matches on word prefixes (typing "serv" finds
     *   "servidor"), which Postgres's own `websearch_to_tsquery()` doesn't
     *   do (it only matches whole words).
     *
     * No-op on every other driver (SQLite, MySQL, MariaDB) — those fall
     * back to LIKE in the macro instead.
     *
     * A domain model that wants Postgres full-text search adds its own
     * migration with a generated `tsvector` column plus a GIN index, e.g.:
     *
     *   ALTER TABLE posts ADD COLUMN search_vector tsvector
     *   GENERATED ALWAYS AS (
     *       to_tsvector('portuguese', immutable_unaccent(coalesce(title, '') || ' ' || coalesce(body, '')))
     *   ) STORED;
     *
     *   CREATE INDEX CONCURRENTLY posts_search_vector_index ON posts USING gin (search_vector);
     *
     * (the second statement needs `public $withinTransaction = false;` on
     * the migration, since `CREATE INDEX CONCURRENTLY` can't run inside a
     * transaction).
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('CREATE EXTENSION IF NOT EXISTS unaccent');

        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION immutable_unaccent(text)
            RETURNS text AS $$
                SELECT unaccent('unaccent', $1)
            $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION prefix_tsquery(config regconfig, search_text text)
            RETURNS tsquery AS $$
                SELECT to_tsquery(config, string_agg(lexeme || ':*', ' & '))
                FROM unnest(tsvector_to_array(to_tsvector(config, search_text))) AS lexeme
            $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE
        SQL);
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::unprepared('DROP FUNCTION IF EXISTS prefix_tsquery(regconfig, text)');
        DB::unprepared('DROP FUNCTION IF EXISTS immutable_unaccent(text)');
    }
};
