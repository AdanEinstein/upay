<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class CustomerPublicLinkController extends Controller
{
    public function __invoke(Customer $customer): RedirectResponse
    {
        $customer->rotatePublicToken();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('New link generated. The old one no longer works.')]);

        return back();
    }
}
