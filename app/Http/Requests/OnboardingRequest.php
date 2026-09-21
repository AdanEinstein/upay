<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesPixKey;
use Illuminate\Foundation\Http\FormRequest;

class OnboardingRequest extends FormRequest
{
    use ValidatesPixKey;

    protected function prepareForValidation(): void
    {
        $this->normalizePixKey();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'image', 'max:1024'],
            'product_name' => ['nullable', 'string', 'max:255'],
            'product_price_cents' => ['nullable', 'required_with:product_name', 'integer', 'min:0', 'max:99999999'],
            'product_photo' => ['nullable', 'image', 'max:2048'],
            ...$this->pixKeyRules(),
        ];
    }
}
