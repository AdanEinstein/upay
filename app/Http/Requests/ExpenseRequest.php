<?php

namespace App\Http\Requests;

use App\Models\Expense;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExpenseRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'amount_cents' => ['required', 'integer', 'min:1', 'max:99999999'],
            'category' => ['required', Rule::in(Expense::CATEGORIES)],
            'due_date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:255'],
            'receipt' => ['nullable', 'image', 'max:2048'],
            'recurring' => ['boolean'],
            'paid' => ['boolean'],
        ];
    }
}
