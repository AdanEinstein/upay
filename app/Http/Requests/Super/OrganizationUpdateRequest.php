<?php

namespace App\Http\Requests\Super;

use App\Enums\OrganizationStatus;
use App\Models\Organization;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class OrganizationUpdateRequest extends FormRequest
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
                Rule::unique('organizations', 'slug')->ignore($this->route('organization')),
            ],
            'status' => ['required', new Enum(OrganizationStatus::class)],
        ];
    }
}
