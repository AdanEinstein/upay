<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        foreach (['phone', 'document'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => preg_replace('/\D/', '', $this->input($field))]);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'regex:/^\d{10,13}$/'],
            'document' => ['nullable', 'string', 'regex:/^(\d{11}|\d{14})$/'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
