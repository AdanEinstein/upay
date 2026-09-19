<?php

use App\Models\ErrorOccurrence;
use App\Models\Organization;
use App\Models\User;
use App\Support\ErrorOccurrenceRecorder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

uses(RefreshDatabase::class);

test('a 404 response is recorded', function () {
    $this->get('/some/missing/path')->assertNotFound();

    $occurrence = ErrorOccurrence::firstOrFail();

    expect($occurrence->status)->toBe(404);
    expect($occurrence->method)->toBe('GET');
    expect($occurrence->path)->toBe('some/missing/path');
    expect($occurrence->organization_id)->toBeNull();
});

test('identical errors within a minute collapse into one row', function () {
    $this->get('/some/missing/path');
    $this->get('/some/missing/path');
    $this->get('/another/missing/path');

    expect(ErrorOccurrence::count())->toBe(2);
});

test('statuses outside the recorded list are ignored', function () {
    ErrorOccurrenceRecorder::record(Request::create('/x'), new Exception('nope'), 422);

    expect(ErrorOccurrence::count())->toBe(0);
});

test('the authenticated tenant user attributes the error to their organization', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->create(['organization_id' => $organization->id]);

    $this->actingAs($user)->get('/some/missing/path');

    $occurrence = ErrorOccurrence::firstOrFail();

    expect($occurrence->organization_id)->toBe($organization->id);
    expect($occurrence->user_id)->toBe($user->id);
});

test('occurrences older than 30 days are prunable', function () {
    $old = ErrorOccurrence::factory()->create(['created_at' => now()->subDays(31)]);
    $recent = ErrorOccurrence::factory()->create(['created_at' => now()->subDays(29)]);

    $this->artisan('model:prune', ['--model' => [ErrorOccurrence::class]])->assertSuccessful();

    $this->assertModelMissing($old);
    $this->assertModelExists($recent);
});
