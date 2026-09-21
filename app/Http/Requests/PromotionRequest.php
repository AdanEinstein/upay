<?php

namespace App\Http\Requests;

use App\Enums\PromotionType;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PromotionRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'product_ids' => ['required', 'array', 'min:1'],
            'product_ids.*' => ['integer', Rule::exists(Product::class, 'id')->where('organization_id', $this->user()->organization_id)],
            'type' => ['required', Rule::enum(PromotionType::class)],
            'percent' => ['required_if:type,percent', 'nullable', 'integer', 'min:5', 'max:70'],
            'original_price_cents' => ['required_if:type,price', 'nullable', 'integer', 'min:1', 'max:99999999'],
            'promo_price_cents' => ['required_if:type,price', 'nullable', 'integer', 'min:1', 'max:99999999', 'lt:original_price_cents'],
            'starts_on' => ['nullable', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
        ];
    }
}
