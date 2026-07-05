import type { CartLine } from "@/contexts/CartContext";

const PREFIX = "nisha_cart_";

export function cartStorageKey(slug: string): string {
  return `${PREFIX}${slug}`;
}

export type StoredCart = {
  items: CartLine[];
  updatedAt: string;
};

export function loadCartFromStorage(slug: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(cartStorageKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredCart;
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

export function saveCartToStorage(slug: string, items: CartLine[]): void {
  if (typeof window === "undefined") return;
  const payload: StoredCart = { items, updatedAt: new Date().toISOString() };
  localStorage.setItem(cartStorageKey(slug), JSON.stringify(payload));
}
