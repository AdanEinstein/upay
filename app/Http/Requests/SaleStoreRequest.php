<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Models\Customer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaleStoreRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $onCredit = $this->input('payment_type') !== 'avista';

        return [
            'customer_id' => [$onCredit ? 'required' : 'nullable', 'integer', Rule::exists(Customer::class, 'id')->where('organization_id', $this->user()->organization_id)],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:9999'],
            'payment_type' => ['required', Rule::in(['avista', 'fiado', 'parcelado'])],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'installments' => ['required_if:payment_type,parcelado', 'nullable', 'integer', 'min:2', 'max:12'],
            'down_payment_cents' => ['nullable', 'integer', 'min:0', 'max:99999999'],
            'first_due_date' => ['nullable', 'date', 'after_or_equal:today'],
        ];
    }
}
