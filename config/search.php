<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Full-text search language per locale
    |--------------------------------------------------------------------------
    |
    | Maps the active app locale to a PostgreSQL text search configuration
    | (regconfig), used by the searchText() query builder macro to build
    | tsvector/tsquery expressions with the right stemming/stopword rules.
    |
    */

    'languages' => [
        'pt-BR' => 'portuguese',
        'en-US' => 'english',
    ],

    /*
    |--------------------------------------------------------------------------
    | Default language
    |--------------------------------------------------------------------------
    |
    | Used when the active locale has no entry above. 'simple' is Postgres's
    | neutral regconfig (no stemming/stopwords) — a safe fallback for any
    | locale the app doesn't explicitly map.
    |
    */

    'default_language' => 'simple',

];
