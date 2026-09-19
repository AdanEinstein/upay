<?php

namespace App\Enums;

enum Locale: string
{
    case PtBr = 'pt_BR';
    case EnUs = 'en_US';

    /**
     * The BCP 47 tag used by the frontend (i18next, <html lang>, Intl).
     */
    public function bcp47(): string
    {
        return str_replace('_', '-', $this->value);
    }
}
