<?php

namespace App\Http\Controllers\Super;

use App\Http\Controllers\Controller;
use App\Http\Requests\Super\PlanRequest;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('super/plans', [
            'plans' => Plan::query()
                ->withCount(['subscriptions as organizations_count' => fn ($query) => $query->whereNull('canceled_at')])
                ->orderByDesc('active')
                ->orderBy('price_cents')
                ->get()
                ->map(fn (Plan $plan) => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'priceCents' => $plan->price_cents,
                    'annualPriceCents' => $plan->annual_price_cents,
                    'limits' => collect(Plan::LIMIT_KEYS)->mapWithKeys(fn (string $key) => [$key => $plan->limits[$key] ?? null]),
                    'active' => $plan->active,
                    'featured' => $plan->featured,
                    'organizationsCount' => $plan->organizations_count,
                ]),
            'limitKeys' => Plan::LIMIT_KEYS,
        ]);
    }

    public function store(PlanRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $plan = Plan::create([
                ...$this->attributes($request),
                'slug' => Plan::uniqueSlugFor($request->validated('name')),
            ]);

            $this->keepSingleFeatured($plan);
        });

        return to_route('super-admin.plans.index');
    }

    public function update(PlanRequest $request, Plan $plan): RedirectResponse
    {
        DB::transaction(function () use ($request, $plan): void {
            $plan->update($this->attributes($request));

            $this->keepSingleFeatured($plan);
        });

        return to_route('super-admin.plans.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(PlanRequest $request): array
    {
        return [
            'name' => $request->validated('name'),
            'price_cents' => $request->validated('price_cents'),
            'annual_price_cents' => $request->validated('annual_price_cents'),
            'limits' => collect(Plan::LIMIT_KEYS)->mapWithKeys(fn (string $key) => [$key => $request->validated("limits.{$key}")])->all(),
            'active' => $request->boolean('active'),
            'featured' => $request->boolean('featured'),
        ];
    }

    private function keepSingleFeatured(Plan $plan): void
    {
        if ($plan->featured) {
            Plan::query()->whereKeyNot($plan->id)->update(['featured' => false]);
        }
    }
}
