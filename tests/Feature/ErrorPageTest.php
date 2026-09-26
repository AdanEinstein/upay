<?php

use App\Models\ErrorOccurrence;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

test('404 renders the friendly error page outside testing', function () {
    app()['env'] = 'production';

    $this->get('/some/missing/path')
        ->assertNotFound()
        ->assertInertia(fn ($page) => $page->component('error')
            ->where('status', 404)
            ->where('loginUrl', null)
            ->where('errorId', ErrorOccurrence::where('status', 404)->value('id'))
        );
});

test('deduplicated errors render without an error id', function () {
    app()['env'] = 'production';

    $this->get('/some/missing/path')->assertInertia(fn ($page) => $page->whereNot('errorId', null));
    $this->get('/some/missing/path')->assertInertia(fn ($page) => $page->where('errorId', null));
});

test('404 keeps the raw laravel response in testing', function () {
    $response = $this->get('/some/missing/path');

    $response->assertNotFound();
    expect($response->headers->get('X-Inertia'))->toBeNull();
});

test('500 keeps the raw laravel response in local for the debug trace', function () {
    app()['env'] = 'local';

    Route::get('/boom', fn () => throw new RuntimeException('boom'));

    $response = $this->get('/boom');

    $response->assertServerError();
    expect($response->headers->get('X-Inertia'))->toBeNull();
});

test('json requests keep the json error response', function () {
    app()['env'] = 'production';

    $this->getJson('/some/missing/path')
        ->assertNotFound()
        ->assertJsonStructure(['message']);
});

test('429 renders the friendly error page', function () {
    app()['env'] = 'production';

    Route::middleware('throttle:1,1')->get('/limited', fn () => 'ok');

    $this->get('/limited')->assertOk();

    $this->get('/limited')
        ->assertStatus(429)
        ->assertInertia(fn ($page) => $page->component('error')->where('status', 429));
});

test('403 inside a tenant points loginUrl to that tenant login', function () {
    app()['env'] = 'production';

    Route::middleware('web')->get('/{organization}/forbidden', fn () => abort(403));

    $this->get('/some-store/forbidden')
        ->assertForbidden()
        ->assertInertia(fn ($page) => $page->component('error')
            ->where('status', 403)
            ->where('loginUrl', route('login', ['organization' => 'some-store']))
        );
});
