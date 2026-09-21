<?php

namespace App\Http\Requests\Concerns;

use App\Enums\PixKeyType;
use Illuminate\Validation\Rule;

trait ValidatesPixKey
{
    protected function normalizePixKey(): void
    {
        if (! is_string($this->pix_key)) {
            return;
        }

        $key = trim($this->pix_key);

        $this->merge(['pix_key' => match ($this->pix_key_type) {
            PixKeyType::Cpf->value, PixKeyType::Cnpj->value, PixKeyType::Phone->value => preg_replace('/\D/', '', $key),
            PixKeyType::Email->value => mb_strtolower($key),
            default => $key,
        }]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function pixKeyRules(): array
    {
        return [
            'pix_key_type' => ['required', Rule::enum(PixKeyType::class)],
            'pix_key' => ['required', 'string', 'max:255', match ($this->pix_key_type) {
                PixKeyType::Email->value => 'email',
                PixKeyType::Cpf->value => 'regex:/^\d{11}$/',
                PixKeyType::Cnpj->value => 'regex:/^\d{14}$/',
                PixKeyType::Phone->value => 'regex:/^\d{10,13}$/',
                default => 'max:77',
            }],
        ];
    }
}
