"use client";

import { useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { publicPaths } from "@/lib/paths/public";
import { buttonClassName } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import Link from "next/link";

type CartDrawerProps = {
  open: boolean;
  slug: string;
  onClose: () => void;
};

function faDigits(value: number): string {
  return value.toLocaleString("fa-IR");
}

function CartBagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M6 6h15l-1.5 9h-12L6 6Z" strokeLinejoin="round" />
      <path d="M6 6 5 3H2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
    </svg>
  );
}

export function CartDrawer({ open, slug, onClose }: CartDrawerProps) {
  const { items, subtotal, updateQuantity, removeItem, itemCount } = useCart();

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    if (mq.matches) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/45 lg:hidden"
          aria-label="بستن سبد خرید"
          onClick={onClose}
        />
      ) : null}

      {/*
        Wrapper owns sticky/fixed layout. Opaque underlay blocks animated atmosphere
        from blinking through glass; the panel itself stays glass-panel / bg-surface.
      */}
      <div
        className={cn(
          "relative isolate",
          "max-lg:fixed max-lg:bottom-0 max-lg:end-0 max-lg:z-50 max-lg:max-h-[88vh] max-lg:w-full",
          "max-lg:rounded-t-3xl max-lg:transition-transform max-lg:duration-300 max-lg:ease-out",
          open ? "max-lg:translate-y-0" : "max-lg:pointer-events-none max-lg:translate-y-full",
          "lg:sticky lg:top-[5.25rem] lg:z-10 lg:max-h-[calc(100vh-7rem)] lg:w-[22rem] lg:shrink-0 lg:self-start",
        )}
      >
        <div
          aria-hidden
          className="absolute inset-0 -z-10 rounded-t-3xl bg-[rgb(var(--color-background))] lg:rounded-2xl max-lg:rounded-t-3xl"
        />

        <aside
          className={cn(
            "glass-panel flex max-h-[inherit] w-full flex-col overflow-hidden border border-border bg-surface shadow-2xl",
            "max-lg:max-h-[88vh] max-lg:rounded-t-3xl lg:max-h-[calc(100vh-7rem)] lg:rounded-2xl lg:shadow-sm",
          )}
          aria-label="سبد خرید"
        >
          <div className="flex justify-center pt-2 lg:hidden" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-border" />
          </div>
          <div className="border-b border-border/80 px-4 pb-3.5 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-muted text-brand">
                  <CartBagIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">سبد خرید</h2>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {itemCount === 0 ? "هنوز کالایی اضافه نشده" : `${faDigits(itemCount)} کالا در سبد`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-foreground-muted transition hover:bg-surface-muted hover:text-foreground lg:hidden"
                onClick={onClose}
                aria-label="بستن سبد خرید"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted text-foreground-muted">
                  <CartBagIcon className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-foreground">سبد خالیه</p>
                <p className="mt-1 max-w-[14rem] text-xs leading-5 text-foreground-muted">
                  محصول‌ها رو با دکمه + به سبد اضافه کن.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => {
                  const lineKey = `${item.productId}-${item.variantId ?? "base"}`;
                  const lineTotal = parseFloat(item.price) * item.quantity;
                  const atMin = item.quantity <= 1;
                  const atMax = item.quantity >= item.stockQuantity;

                  return (
                    <li
                      key={lineKey}
                      className="rounded-xl border border-border/80 bg-surface-muted/60 p-2.5"
                    >
                      <div className="flex gap-2.5">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-surface">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={resolveMediaUrl(item.imageUrl)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground-muted">
                              —
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                              {item.variantName ? (
                                <p className="mt-0.5 truncate text-[11px] text-foreground-muted">{item.variantName}</p>
                              ) : null}
                              <p className="mt-0.5 text-[11px] text-foreground-muted">
                                {formatMoney(item.price)}
                                <span className="mx-1 opacity-40">·</span>
                                هر عدد
                              </p>
                            </div>
                            <button
                              type="button"
                              className="rounded-md p-1 text-foreground-muted transition hover:bg-surface hover:text-red-600"
                              onClick={() => removeItem(item.productId, item.variantId ?? null)}
                              aria-label={`حذف ${item.title}`}
                              title="حذف"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5" aria-hidden>
                                <path d="M5 7h14M10 7V5h4v2M9 7l.6 12h4.8L15 7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <div className="inline-flex items-center rounded-lg border border-border bg-surface">
                              <button
                                type="button"
                                disabled={atMin}
                                onClick={() =>
                                  updateQuantity(item.productId, item.quantity - 1, item.variantId ?? null)
                                }
                                className="flex h-7 w-7 items-center justify-center text-foreground-muted transition hover:text-foreground disabled:opacity-30"
                                aria-label="کاهش تعداد"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden>
                                  <path d="M5 12h14" strokeLinecap="round" />
                                </svg>
                              </button>
                              <span className="min-w-7 px-1 text-center text-xs font-semibold tabular-nums text-foreground">
                                {faDigits(item.quantity)}
                              </span>
                              <button
                                type="button"
                                disabled={atMax}
                                onClick={() =>
                                  updateQuantity(item.productId, item.quantity + 1, item.variantId ?? null)
                                }
                                className="flex h-7 w-7 items-center justify-center text-foreground-muted transition hover:text-foreground disabled:opacity-30"
                                aria-label="افزایش تعداد"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden>
                                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                                </svg>
                              </button>
                            </div>

                            <p className="text-sm font-semibold tabular-nums tracking-tight text-foreground">
                              {formatMoney(lineTotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3.5">
            <div className="mb-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <span>جمع کالاها</span>
                <span className="tabular-nums">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex items-end justify-between gap-3">
                <span className="text-sm font-medium text-foreground">مبلغ قابل پرداخت</span>
                <span className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                  {formatMoney(subtotal)}
                </span>
              </div>
            </div>

            <Link
              href={publicPaths.storeCheckout(slug)}
              onClick={onClose}
              aria-disabled={items.length === 0}
              className={cn(
                buttonClassName({ size: "md" }),
                "w-full gap-2",
                items.length === 0 && "pointer-events-none opacity-50",
              )}
            >
              بزن بریم
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 rotate-180" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
