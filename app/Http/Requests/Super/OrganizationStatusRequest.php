<?php

namespace App\Http\Requests\Super;

use App\Enums\OrganizationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OrganizationStatusRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(OrganizationStatus::class)],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
