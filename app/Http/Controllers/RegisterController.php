<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Models\Organization;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class RegisterController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/register', [
            'plans' => Plan::publicList(),
        ]);
    }

    /**
     * A full page load into the new organization (not an Inertia visit), so the
     * page head links its manifest and the app installs scoped to the store.
     */
    public function store(RegisterRequest $request): SymfonyResponse
    {
        $plan = Plan::query()->where('slug', $request->validated('plan'))->firstOrFail();

        $user = DB::transaction(function () use ($request, $plan): User {
            $organization = Organization::create([
                'name' => $request->validated('store_name'),
                'slug' => Organization::uniqueSlugFor($request->validated('store_name')),
            ]);

            $organization->subscription()->create([
                'plan_id' => $plan->id,
                'price_cents' => $plan->price_cents,
            ]);

            return $organization->users()->create([
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                'password' => $request->validated('password'),
            ]);
        });

        Auth::login($user);
        $request->session()->regenerate();

        return Inertia::location(route('onboarding.show', ['organization' => $user->organization->slug]));
    }
}
