<?php

namespace App\Http\Requests;

use App\Models\Organization;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CatalogIdentityRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('whatsapp'))) {
            $this->merge(['whatsapp' => preg_replace('/\D/', '', $this->input('whatsapp'))]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'logo' => ['nullable', 'image', 'max:1024'],
            'cover' => ['nullable', 'image', 'max:2048'],
            'welcome_text' => ['nullable', 'string', 'max:500'],
            'whatsapp' => ['nullable', 'string', 'regex:/^\d{10,13}$/'],
            'accent_color' => ['required', Rule::in(array_keys(Organization::ACCENT_PALETTE))],
        ];
    }
}
