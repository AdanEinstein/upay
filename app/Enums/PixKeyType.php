<?php

namespace App\Enums;

enum PixKeyType: string
{
    case Cpf = 'cpf';
    case Cnpj = 'cnpj';
    case Email = 'email';
    case Phone = 'phone';
    case Random = 'random';
}
