<?php

namespace App\Http\Controllers\Settings;

use App\Enums\Locale;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\LocaleUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LocaleController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/language');
    }

    public function update(LocaleUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'locale' => $request->enum('locale', Locale::class),
        ]);

        return back();
    }
}
