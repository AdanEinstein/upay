<?php

use App\Models\Expense;
use App\Models\Installment;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\User;
use App\Support\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->organization = $this->user->organization;
});

afterEach(fn () => Tenant::forget());

test('profit is payments received minus expenses paid in the period', function () {
    $sale = Sale::factory()->create(['organization_id' => $this->organization->id]);
    $installment = Installment::factory()->create(['sale_id' => $sale->id, 'amount_cents' => 20000]);
    Payment::factory()->create(['installment_id' => $installment->id, 'amount_cents' => 15000, 'paid_at' => now()]);
    Payment::factory()->create(['installment_id' => $installment->id, 'amount_cents' => 1000, 'paid_at' => now()->subMonths(2)]);
    Expense::factory()->create(['organization_id' => $this->organization->id, 'amount_cents' => 4000, 'paid_at' => now()]);
    Expense::factory()->create(['organization_id' => $this->organization->id, 'amount_cents' => 7000, 'paid_at' => null, 'due_date' => today()]);

    $this->actingAs($this->user)->get(shopRoute('finance.index', ['period' => 'month']))->assertInertia(fn (Assert $page) => $page
        ->component('finance')
        ->where('revenueCents', 15000)
        ->where('expensesCents', 4000)
        ->where('profitCents', 11000)
        ->where('payableCents', 7000)
        ->where('isEmpty', false));
});

test('an empty period is flagged as empty', function () {
    $this->actingAs($this->user)->get(shopRoute('finance.index', ['period' => 'week']))->assertInertia(fn (Assert $page) => $page
        ->where('isEmpty', true)
        ->has('series', 7));
});

test('marking a recurring expense paid schedules next month', function () {
    $expense = Expense::factory()->create([
        'organization_id' => $this->organization->id,
        'paid_at' => null,
        'due_date' => '2026-01-31',
        'recurring' => true,
        'amount_cents' => 90000,
    ]);

    $this->actingAs($this->user)->post(shopRoute('expenses.pay', ['expense' => $expense->id]))->assertRedirect();
    $this->actingAs($this->user)->post(shopRoute('expenses.pay', ['expense' => $expense->id]));

    $next = Expense::query()->whereNull('paid_at')->get();

    expect($expense->fresh()->paid_at)->not->toBeNull()
        ->and($next)->toHaveCount(1)
        ->and($next[0]->due_date->toDateString())->toBe('2026-02-28');
});

test('payables list groups unpaid expenses by urgency', function () {
    foreach ([-3, 0, 2, 40] as $offset) {
        Expense::factory()->create(['organization_id' => $this->organization->id, 'paid_at' => null, 'due_date' => today()->addDays($offset)]);
    }
    Expense::factory()->create(['organization_id' => $this->organization->id]);

    $this->actingAs($this->user)->get(shopRoute('payables.index'))->assertInertia(fn (Assert $page) => $page
        ->component('payables')
        ->has('groups.overdue', 1)
        ->has('groups.today', 1)
        ->where('groups.later', fn ($later) => count($later) >= 1));
});

test('expense form validates category and stores a receipt', function () {
    $this->actingAs($this->user)->post(shopRoute('expenses.store'), ['amount_cents' => 100, 'category' => 'bogus', 'due_date' => today()->toDateString(), 'description' => 'x'])
        ->assertSessionHasErrors('category');

    $this->actingAs($this->user)->post(shopRoute('expenses.store'), ['amount_cents' => 100, 'category' => 'rent', 'due_date' => today()->toDateString(), 'description' => 'Aluguel', 'paid' => true])
        ->assertSessionHasNoErrors();

    expect(Expense::query()->firstOrFail()->paid_at)->not->toBeNull();
});

test('expense receipt is stored privately and served only to its own store', function () {
    Storage::fake('local');
    Storage::fake('public');

    $this->actingAs($this->user)->post(shopRoute('expenses.store'), ['amount_cents' => 100, 'category' => 'rent', 'due_date' => today()->toDateString(), 'description' => 'Aluguel', 'receipt' => UploadedFile::fake()->image('nota.png')])
        ->assertSessionHasNoErrors();

    $expense = Expense::query()->withoutTenant()->sole();
    Storage::disk('local')->assertExists($expense->receipt_path);
    expect(Storage::disk('public')->allFiles())->toBeEmpty();

    $this->actingAs($this->user)->get(shopRoute('expenses.receipt', ['expense' => $expense->id]))->assertOk();

    $stranger = User::factory()->create();
    $this->actingAs($stranger)->get(route('expenses.receipt', ['organization' => $stranger->organization->slug, 'expense' => $expense->id]))->assertNotFound();
});
