<?php

namespace App\Http\Requests\Super;

use Illuminate\Foundation\Http\FormRequest;

class RejectInvoiceRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:255'],
        ];
    }
}
