<?php

namespace App\Http\Controllers;

use App\Http\Requests\PixKeyRequest;
use App\Models\ShopSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PixKeyController extends Controller
{
    public function edit(): Response
    {
        $settings = ShopSetting::current();

        return Inertia::render('pix-key', [
            'pixKeyType' => $settings->pix_key_type?->value ?? 'email',
            'pixKey' => $settings->pix_key ?? '',
        ]);
    }

    public function update(PixKeyRequest $request): RedirectResponse
    {
        ShopSetting::current()->update($request->validated());

        return to_route('more.show');
    }
}
