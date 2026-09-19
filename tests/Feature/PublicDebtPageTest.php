<?php

use Inertia\Testing\AssertableInertia as Assert;

it('renders the public debt page without authentication', function () {
    $this->withoutVite()->get(route('public.debt', ['token' => 'sample-token']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('public/debt'));
});
