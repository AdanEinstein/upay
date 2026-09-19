<?php

namespace Tests\Feature\Auth;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PasswordConfirmationTest extends TestCase
{
    use RefreshDatabase;

    public function test_confirm_password_screen_can_be_rendered()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('password.confirm', ['organization' => $user->organization->slug]));

        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('auth/confirm-password'),
        );
    }

    public function test_password_confirmation_requires_authentication()
    {
        $organization = Organization::factory()->create();

        $response = $this->get(route('password.confirm', ['organization' => $organization->slug]));

        $response->assertRedirect(route('login', ['organization' => $organization->slug]));
    }
}
