<?php

namespace App\Http\Controllers;

use App\Http\Requests\CatalogNoticeRequest;
use App\Models\ShopSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CatalogNoticeController extends Controller
{
    public function edit(): Response
    {
        $settings = ShopSetting::current();

        return Inertia::render('catalog/notice', [
            'text' => $settings->notice_text ?? '',
            'type' => $settings->notice_type->value,
            'expiresOn' => $settings->notice_expires_on?->toDateString(),
            'active' => $settings->notice_active,
        ]);
    }

    public function update(CatalogNoticeRequest $request): RedirectResponse
    {
        ShopSetting::current()->update($request->validated());

        return to_route('catalog.show');
    }
}
