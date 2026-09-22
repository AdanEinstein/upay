<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BillingClaimRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'receipt' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ];
    }
}
