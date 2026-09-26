// Masks fill progressively while typing; the server strips non-digits before validating.
function applyMask(value: string, mask: string): string {
    const digits = value
        .replace(/\D/g, '')
        .slice(0, mask.replaceAll(/[^#]/g, '').length);
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

export function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');

    return applyMask(
        digits,
        digits.length <= 10 ? '(##) ####-####' : '(##) #####-####',
    );
}

export function maskCpf(value: string): string {
    return applyMask(value, '###.###.###-##');
}

export function maskCnpj(value: string): string {
    return applyMask(value, '##.###.###/####-##');
}

export function maskDocument(value: string): string {
    return value.replace(/\D/g, '').length <= 11
        ? maskCpf(value)
        : maskCnpj(value);
}
