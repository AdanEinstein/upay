import { maskCnpj, maskCpf, maskPhone } from '@/lib/mask';

export type PixKeyType = 'email' | 'phone' | 'cpf' | 'cnpj' | 'random';

const MASKS: Partial<Record<PixKeyType, (value: string) => string>> = {
    cpf: maskCpf,
    cnpj: maskCnpj,
    phone: maskPhone,
};

export function maskPixKey(type: PixKeyType, value: string): string {
    return MASKS[type]?.(value) ?? value;
}

export function pixKeyInputMode(
    type: PixKeyType,
): 'email' | 'numeric' | 'text' {
    return type === 'email' ? 'email' : type === 'random' ? 'text' : 'numeric';
}
