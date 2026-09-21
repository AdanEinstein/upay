<?php

namespace App\Http\Controllers\Super;

use App\Enums\OrganizationStatus;
use App\Enums\SubscriptionStatus;
use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\Subscription;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $now = CarbonImmutable::now();
        $monthStart = $now->startOfMonth();

        // ponytail: loads every subscription and folds in PHP; move to SQL aggregates when the table outgrows a request.
        /** @var Collection<int, Subscription> $subscriptions */
        $subscriptions = Subscription::query()->get(['plan_id', 'status', 'price_cents', 'created_at', 'canceled_at']);

        $liveAt = fn (CarbonImmutable $at): Collection => $subscriptions->filter(
            fn (Subscription $subscription) => $subscription->created_at <= $at
                && ($subscription->canceled_at === null || $subscription->canceled_at > $at),
        );
        $mrrAt = fn (CarbonImmutable $at): int => (int) $liveAt($at)->sum('price_cents');

        $live = $liveAt($now);
        $mrr = $mrrAt($now);
        $previousMrr = $mrrAt($monthStart->subSecond());
        $churned = $subscriptions->filter(
            fn (Subscription $subscription) => $subscription->canceled_at !== null && $subscription->canceled_at >= $monthStart,
        )->count();
        $baseAtMonthStart = $liveAt($monthStart->subSecond())->count();
        $planNames = Plan::query()->pluck('name', 'id');

        return Inertia::render('super/dashboard', [
            'mrrCents' => $mrr,
            'mrrChangePercent' => $previousMrr > 0 ? round(($mrr - $previousMrr) / $previousMrr * 100, 1) : null,
            'activeOrganizations' => Organization::query()->where('status', OrganizationStatus::Active)->count(),
            'newOrganizations' => Organization::query()->where('created_at', '>=', $monthStart)->count(),
            'churn' => [
                'count' => $churned,
                'percent' => $baseAtMonthStart > 0 ? round($churned / $baseAtMonthStart * 100, 1) : null,
            ],
            'pastDue' => $live->where('status', SubscriptionStatus::PastDue)->count(),
            'series' => collect(range(11, 0))->map(function (int $monthsAgo) use ($monthStart, $now, $mrrAt): array {
                $month = $monthStart->subMonths($monthsAgo);
                $end = $month->endOfMonth();

                return ['month' => $month->format('Y-m'), 'mrrCents' => $mrrAt($end > $now ? $now : $end)];
            })->all(),
            'byPlan' => $live->groupBy('plan_id')
                ->map(fn (Collection $group, int $planId): array => [
                    'name' => $planNames[$planId] ?? '—',
                    'count' => $group->count(),
                    'percent' => (int) round($group->count() / $live->count() * 100),
                ])
                ->sortByDesc('count')
                ->values()
                ->all(),
        ]);
    }
}
