<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrganizationSettingsUpdateRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'logo' => ['nullable', 'image', 'max:1024'],
            'favicon' => ['nullable', 'image', 'max:512'],
            'accent_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'accent_color_hover' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'accent_color_soft' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'on_primary_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ];
    }
}
