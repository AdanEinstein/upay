<?php

namespace Tests\Feature;

use App\Models\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_a_successful_response()
    {
        $response = $this->get(route('home'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('welcome'));
    }

    public function test_lists_only_active_plans_by_price()
    {
        Plan::query()->delete();
        Plan::factory()->create(['slug' => 'pro', 'price_cents' => 4990]);
        Plan::factory()->create(['slug' => 'basic', 'price_cents' => 2990]);
        Plan::factory()->create(['slug' => 'old', 'price_cents' => 100, 'active' => false]);

        $this->get(route('home'))->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('plans', 2)
            ->where('plans.0.slug', 'basic')
            ->where('plans.1.slug', 'pro'));
    }
}
