import { useEffect, useState } from 'react';

export type CartItem = {
    productId: number;
    variantId: number | null;
    quantity: number;
};

export const MAX_CART_QUANTITY = 99;

function storageKey(slug: string): string {
    return `catalog-cart:${slug}`;
}

function isCartItem(value: unknown): value is CartItem {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const item = value as Record<string, unknown>;

    return (
        Number.isInteger(item.productId) &&
        (item.variantId === null || Number.isInteger(item.variantId)) &&
        Number.isInteger(item.quantity) &&
        (item.quantity as number) > 0
    );
}

function readCart(slug: string): CartItem[] {
    try {
        const stored: unknown = JSON.parse(
            localStorage.getItem(storageKey(slug)) ?? '[]',
        );

        return Array.isArray(stored) ? stored.filter(isCartItem) : [];
    } catch {
        return [];
    }
}

const sameLine = (
    item: CartItem,
    productId: number,
    variantId: number | null,
) => item.productId === productId && item.variantId === variantId;

const clamp = (quantity: number) =>
    Math.min(MAX_CART_QUANTITY, Math.max(0, quantity));

// The cart lives only in the visitor's browser, one per store, so it survives
// reloads and coming back later without the store needing an account for them.
export function useCatalogCart(slug: string) {
    const [items, setItems] = useState<CartItem[]>(() => readCart(slug));

    useEffect(() => {
        try {
            localStorage.setItem(storageKey(slug), JSON.stringify(items));
        } catch {
            // Private mode: the cart still works until the tab closes.
        }
    }, [slug, items]);

    function add(
        productId: number,
        variantId: number | null,
        quantity: number,
    ) {
        setItems((current) =>
            current.some((item) => sameLine(item, productId, variantId))
                ? current.map((item) =>
                      sameLine(item, productId, variantId)
                          ? {
                                ...item,
                                quantity: clamp(item.quantity + quantity),
                            }
                          : item,
                  )
                : [
                      ...current,
                      { productId, variantId, quantity: clamp(quantity) },
                  ],
        );
    }

    function setQuantity(
        productId: number,
        variantId: number | null,
        quantity: number,
    ) {
        setItems((current) =>
            current
                .map((item) =>
                    sameLine(item, productId, variantId)
                        ? { ...item, quantity: clamp(quantity) }
                        : item,
                )
                .filter((item) => item.quantity > 0),
        );
    }

    return {
        items,
        add,
        setQuantity,
        clear: () => setItems([]),
    };
}
