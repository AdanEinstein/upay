// Stored phones are digits only, usually without the country code (Brazil, +55).
export function whatsappUrl(phone: string | null, text: string): string {
    const digits = (phone ?? '').replace(/\D/g, '');
    const full =
        digits.length > 0 && digits.length <= 11 ? `55${digits}` : digits;

    return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

export function publicDebtUrl(token: string): string {
    return `${window.location.origin}/p/${token}`;
}

export function formatPhone(phone: string | null): string {
    const digits = (phone ?? '')
        .replace(/\D/g, '')
        .replace(/^55(?=\d{10,11}$)/, '');

    if (digits.length === 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return digits;
}
