"use client";

import { useEffect, useState } from "react";
import * as storesApi from "@/lib/api/public/stores";
import { PublicShell } from "@/components/layout/PublicShell";
import { CartDrawer } from "@/components/store/CartDrawer";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

function StoreCartButton({
  onClick,
  compact = false,
}: {
  onClick: () => void;
  compact?: boolean;
}) {
  const { itemCount } = useCart();

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-muted",
        )}
        aria-label={`سبد خرید${itemCount > 0 ? `، ${itemCount} قلم` : ""}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <path d="M6 6h15l-1.5 9h-12L6 6Z" strokeLinejoin="round" />
          <path d="M6 6 5 3H2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground">
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={onClick}>
      سبد خرید{itemCount > 0 ? ` (${itemCount})` : ""}
    </Button>
  );
}

function StoreShellInner({
  slug,
  storeName,
  children,
}: {
  slug: string;
  storeName: string;
  children: React.ReactNode;
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const openCart = () => setCartOpen(true);

  return (
    <PublicShell
      title={storeName}
      showDefaultActions={false}
      mobileActions={<StoreCartButton compact onClick={openCart} />}
      actions={<StoreCartButton onClick={openCart} />}
    >
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">{children}</div>
        <CartDrawer open={cartOpen} slug={slug} onClose={() => setCartOpen(false)} />
      </div>
    </PublicShell>
  );
}

export function StoreLayoutWrapper({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [storeName, setStoreName] = useState(slug);

  useEffect(() => {
    storesApi
      .getStoreBySlug(slug)
      .then((data) => setStoreName(data.store.name))
      .catch(() => setStoreName(slug));
  }, [slug]);

  return (
    <CartProvider slug={slug}>
      <StoreShellInner slug={slug} storeName={storeName}>
        {children}
      </StoreShellInner>
    </CartProvider>
  );
}
