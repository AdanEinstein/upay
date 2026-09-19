<?php

namespace App\Http\Requests\Super;

use App\Models\Organization;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class OrganizationStoreRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->slug)) {
            $this->merge(['slug' => Str::slug($this->slug)]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required', 'string', 'max:255', 'alpha_dash',
                Rule::notIn(Organization::RESERVED_SLUGS),
                'unique:organizations,slug',
            ],
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'admin_password' => ['required', 'confirmed', Password::defaults()],
        ];
    }
}
