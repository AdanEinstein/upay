<?php

namespace App\Http\Requests;

use App\Enums\NoticeType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CatalogNoticeRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'notice_text' => ['nullable', 'string', 'max:120'],
            'notice_type' => ['required', Rule::enum(NoticeType::class)],
            'notice_expires_on' => ['nullable', 'date', 'after_or_equal:today'],
            'notice_active' => ['boolean'],
        ];
    }
}
