"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { publicPaths } from "@/lib/paths/public";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type CartDrawerProps = {
  open: boolean;
  slug: string;
  onClose: () => void;
};

export function CartDrawer({ open, slug, onClose }: CartDrawerProps) {
  const { items, subtotal, updateQuantity, removeItem, itemCount } = useCart();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          aria-label="بستن سبد خرید"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed bottom-0 end-0 z-50 flex max-h-[85vh] w-full flex-col border-e border-border bg-surface shadow-xl transition-transform duration-200 sm:max-w-md lg:static lg:z-auto lg:max-h-none lg:w-80 lg:shrink-0 lg:translate-x-0 lg:rounded-xl lg:border lg:shadow-sm",
          open ? "translate-y-0" : "translate-y-full lg:translate-y-0",
          !open && "pointer-events-none opacity-0 lg:pointer-events-auto lg:opacity-100",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-semibold text-foreground">سبد خرید ({itemCount})</h2>
          <button type="button" className="text-foreground-muted lg:hidden" onClick={onClose} aria-label="بستن سبد خرید">
            بستن
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-center text-sm text-foreground-muted">سبد خرید شما خالی است</p>
              <Link href={publicPaths.store(slug)} onClick={onClose}>
                <Button variant="secondary" size="sm">
                  مشاهده محصولات فروشگاه
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveMediaUrl(item.imageUrl)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-foreground-muted">{formatMoney(item.price)} برای هر عدد</p>
                    <div className="mt-2 flex items-center gap-2">
                      <label className="sr-only" htmlFor={`cart-qty-${item.productId}`}>
                        تعداد {item.title}
                      </label>
                      <input
                        id={`cart-qty-${item.productId}`}
                        type="number"
                        min={1}
                        max={item.stockQuantity}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.productId, Number(e.target.value))
                        }
                        className="w-14 rounded border border-border bg-surface px-2 py-2 text-sm"
                      />
                      <button
                        type="button"
                        className="rounded px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                        onClick={() => removeItem(item.productId)}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-medium">
                    {formatMoney(parseFloat(item.price) * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mb-3 flex justify-between text-sm">
            <span className="text-foreground-muted">جمع جزء</span>
            <span className="font-semibold">{formatMoney(subtotal)}</span>
          </div>
          <Link href={publicPaths.storeCheckout(slug)} onClick={onClose}>
            <Button className="w-full" disabled={items.length === 0}>
              پرداخت
            </Button>
          </Link>
        </div>
      </aside>
    </>
  );
}
