<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['min_stock' => $this->input('min_stock') ?? 0]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Product|null $product */
        $product = $this->route('product');
        $existing = $product?->images()->count() ?? 0;
        $removing = count($this->input('remove_image_ids', []));

        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['nullable', 'string', 'max:60'],
            'price_cents' => ['required', 'integer', 'min:0', 'max:99999999'],
            'cost_cents' => ['nullable', 'integer', 'min:0', 'max:99999999'],
            'stock_qty' => ['nullable', 'integer', 'min:0', 'max:999999'],
            'min_stock' => ['nullable', 'integer', 'min:0', 'max:999999'],
            'catalog_visible' => ['boolean'],
            'variants' => ['array', 'max:30'],
            'variants.*.id' => ['nullable', 'integer'],
            'variants.*.name' => ['required', 'string', 'max:60'],
            'variants.*.stock_qty' => ['required', 'integer', 'min:0', 'max:999999'],
            'photos' => ['array', 'max:'.max(0, 4 - $existing + $removing)],
            'photos.*' => ['image', 'max:2048'],
            'remove_image_ids' => ['array'],
            'remove_image_ids.*' => ['integer', Rule::exists('product_images', 'id')->where('product_id', $product?->id)],
        ];
    }
}
