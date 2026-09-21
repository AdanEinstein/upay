<?php

namespace App\Http\Requests;

use App\Enums\PaymentMethod;
use App\Models\Installment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PaymentStoreRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Installment $installment */
        $installment = $this->route('installment');

        return [
            'amount_cents' => ['required', 'integer', 'min:1', 'max:'.$installment->remainingCents()],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'paid_on' => ['nullable', 'date', 'before_or_equal:today'],
        ];
    }
}
