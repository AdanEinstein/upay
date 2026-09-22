<?php

namespace App\Http\Requests\Super;

use App\Enums\BillingCycle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OrganizationSubscriptionRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'plan_id' => ['required', 'integer', Rule::exists('plans', 'id')->where('active', true)],
            'billing_cycle' => ['sometimes', Rule::enum(BillingCycle::class)],
        ];
    }
}
