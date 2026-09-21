<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesPixKey;
use Illuminate\Foundation\Http\FormRequest;

class PixKeyRequest extends FormRequest
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
        return $this->pixKeyRules();
    }
}
