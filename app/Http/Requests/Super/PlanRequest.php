<?php

namespace App\Http\Requests\Super;

use App\Models\Plan;
use Illuminate\Foundation\Http\FormRequest;

class PlanRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'price_cents' => ['required', 'integer', 'min:0', 'max:99999999'],
            'annual_price_cents' => ['nullable', 'integer', 'min:0', 'max:99999999'],
            'limits' => ['nullable', 'array:'.implode(',', Plan::LIMIT_KEYS)],
            'limits.*' => ['nullable', 'integer', 'min:0', 'max:99999999'],
            'active' => ['required', 'boolean'],
            'featured' => ['required', 'boolean'],
        ];
    }
}
