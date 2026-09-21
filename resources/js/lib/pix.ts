export type PixKeyType = 'email' | 'phone' | 'cpf' | 'cnpj' | 'random';

// Masks fill progressively while typing; the server strips non-digits (ValidatesPixKey).
const MASKS: Partial<Record<PixKeyType, string[]>> = {
    cpf: ['###.###.###-##'],
    cnpj: ['##.###.###/####-##'],
    phone: ['(##) ####-####', '(##) #####-####'],
};

function applyMask(digits: string, mask: string): string {
    let index = 0;
    let out = '';

    for (const char of mask) {
        if (index >= digits.length) {
            break;
        }

        out += char === '#' ? digits[index++] : char;
    }

    return out;
}

export function maskPixKey(type: PixKeyType, value: string): string {
    const masks = MASKS[type];

    if (!masks) {
        return value;
    }

    let digits = value.replace(/\D/g, '');

    if (type === 'phone') {
        digits = digits.replace(/^55(?=\d{10,11}$)/, '');
    }

    const mask = masks.at(-1)!;
    const limit = mask.replaceAll(/[^#]/g, '').length;
    digits = digits.slice(0, limit);

    return applyMask(digits, digits.length <= 10 ? masks[0] : mask);
}

export function pixKeyInputMode(
    type: PixKeyType,
): 'email' | 'numeric' | 'text' {
    return type === 'email' ? 'email' : type === 'random' ? 'text' : 'numeric';
}
