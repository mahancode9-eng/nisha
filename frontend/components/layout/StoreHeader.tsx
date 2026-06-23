"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { paths } from "@/lib/auth/paths";
import { publicPaths } from "@/lib/paths/public";
import { Button } from "@/components/ui/Button";

type StoreHeaderProps = {
  storeName: string;
  slug: string;
  onCartClick?: () => void;
};

export function StoreHeader({ storeName, onCartClick }: StoreHeaderProps) {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <Link href={paths.home} className="text-xs text-foreground-muted hover:text-foreground">
            Nisha
          </Link>
          <p className="truncate font-semibold text-foreground">{storeName}</p>
        </div>
        <nav className="flex items-center gap-2">
          <Link href={publicPaths.trackOrder}>
            <Button variant="ghost" size="sm">
              پیگیری سفارش
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={onCartClick}>
            سبد خرید ({itemCount})
          </Button>
        </nav>
      </div>
    </header>
  );
}
