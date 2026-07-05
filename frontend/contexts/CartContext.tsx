"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadCartFromStorage, saveCartToStorage } from "@/lib/cart/storage";
import type { PublicProduct } from "@/types/public/store";

export type CartLine = {
  productId: number;
  title: string;
  price: string;
  imageUrl: string | null;
  stockQuantity: number;
  quantity: number;
};

type CartContextValue = {
  slug: string;
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (product: PublicProduct, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  reconcileWithProducts: (products: PublicProduct[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCartFromStorage(slug));
    setHydrated(true);
  }, [slug]);

  useEffect(() => {
    if (!hydrated) return;
    saveCartToStorage(slug, items);
  }, [slug, items, hydrated]);

  const addItem = useCallback((product: PublicProduct, quantity = 1) => {
    if (product.stock_quantity <= 0) return;
    const imageUrl = product.images[0]?.image_url ?? null;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, product.stock_quantity);
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: nextQty, stockQuantity: product.stock_quantity, price: String(product.price) }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          title: product.title,
          price: String(product.price),
          imageUrl,
          stockQuantity: product.stock_quantity,
          quantity: Math.min(quantity, product.stock_quantity),
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          if (quantity <= 0) return null;
          return { ...i, quantity: Math.min(quantity, i.stockQuantity) };
        })
        .filter((i): i is CartLine => i !== null),
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const reconcileWithProducts = useCallback((products: PublicProduct[]) => {
    const byId = new Map(products.map((p) => [p.id, p]));
    setItems((prev) => {
      const next: CartLine[] = [];
      for (const line of prev) {
        const product = byId.get(line.productId);
        if (!product || product.stock_quantity <= 0) continue;
        next.push({
          ...line,
          title: product.title,
          price: String(product.price),
          stockQuantity: product.stock_quantity,
          imageUrl: product.images[0]?.image_url ?? line.imageUrl,
          quantity: Math.min(line.quantity, product.stock_quantity),
        });
      }
      return next;
    });
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  function safeParsePrice(price: string): number {
    const num = Number(price);
    return Number.isNaN(num) ? 0 : num;
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + safeParsePrice(i.price) * i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      slug,
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      reconcileWithProducts,
    }),
    [
      slug,
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      reconcileWithProducts,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
