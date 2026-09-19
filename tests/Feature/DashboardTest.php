<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $organization = Organization::factory()->create();

        $response = $this->get(route('dashboard', ['organization' => $organization->slug]));
        $response->assertRedirect(route('login', ['organization' => $organization->slug]));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard', ['organization' => $user->organization->slug]));
        $response->assertOk();
    }

    public function test_the_tenant_prop_is_shared_with_the_current_organization()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard', ['organization' => $user->organization->slug]));

        $response->assertInertia(fn (Assert $page) => $page->where('tenant.slug', $user->organization->slug));
    }

    public function test_users_cannot_visit_another_organizations_dashboard()
    {
        $user = User::factory()->create();
        $otherOrganization = Organization::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard', ['organization' => $otherOrganization->slug]));
        $response->assertForbidden();
    }
}
