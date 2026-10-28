"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { paths } from "@/lib/auth/paths";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/cn";
import type { PublicProduct } from "@/types/public/store";

type ProductCardProps = {
  product: PublicProduct;
  storeSlug: string;
};

function faDigits(value: number): string {
  return value.toLocaleString("fa-IR");
}

/** Compact catalog tile: photo, title, price + animated add action. */
export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const { addItem, items } = useCart();
  const toast = useToast();
  const image = product.images[0];
  const imageUrl = image?.thumbnail_url ?? image?.image_url;
  const href = paths.customer.storeProduct(storeSlug, product.id);
  const hasVariants = (product.variants ?? []).length > 0;
  const outOfStock = product.stock_quantity <= 0;

  const cartQty =
    items.find((line) => line.productId === product.id && (line.variantId ?? null) === null)
      ?.quantity ?? 0;

  const [popping, setPopping] = useState(false);
  const [floatKey, setFloatKey] = useState(0);
  const [floatLabel, setFloatLabel] = useState<string | null>(null);
  const [badgeBump, setBadgeBump] = useState(false);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (popTimer.current) clearTimeout(popTimer.current);
      if (floatTimer.current) clearTimeout(floatTimer.current);
    };
  }, []);

  function triggerFeedback(added: number, nextTotal: number) {
    setPopping(false);
    requestAnimationFrame(() => setPopping(true));
    if (popTimer.current) clearTimeout(popTimer.current);
    popTimer.current = setTimeout(() => setPopping(false), 320);

    setFloatLabel(`+${faDigits(added)}`);
    setFloatKey((key) => key + 1);
    if (floatTimer.current) clearTimeout(floatTimer.current);
    floatTimer.current = setTimeout(() => setFloatLabel(null), 700);

    setBadgeBump(false);
    requestAnimationFrame(() => setBadgeBump(true));
    setTimeout(() => setBadgeBump(false), 280);

    toast.success(`${faDigits(nextTotal)} تا «${product.title}» تو سبد هست`);
  }

  function handleAdd(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (outOfStock) {
      toast.error("این محصول ناموجوده");
      return;
    }
    if (hasVariants) {
      return;
    }
    if (cartQty >= product.stock_quantity) {
      toast.error("بیشتر از این موجودی نداریم");
      return;
    }
    const nextTotal = Math.min(cartQty + 1, product.stock_quantity);
    addItem(product, 1);
    triggerFeedback(1, nextTotal);
  }

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-lg border border-border/80 bg-surface/90",
        "transition duration-200 hover:border-border hover:shadow-sm",
      )}
    >
      <Link href={href} className="relative aspect-[4/5] overflow-hidden bg-surface-muted sm:aspect-square">
        {outOfStock ? (
          <div className="absolute start-1.5 top-1.5 z-10 rounded bg-red-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
            ناموجود
          </div>
        ) : null}
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveMediaUrl(imageUrl)}
            alt={product.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-foreground-muted">
            بدون تصویر
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-2 sm:p-2.5">
        <Link href={href} className="min-w-0">
          <h3 className="line-clamp-2 text-xs font-medium leading-4 text-foreground hover:text-brand sm:text-[13px] sm:leading-5">
            {product.title}
          </h3>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-1.5 pt-0.5">
          <p className="min-w-0 truncate text-[13px] font-semibold tracking-tight text-foreground">
            {formatMoney(product.price)}
          </p>

          {hasVariants ? (
            <Link
              href={href}
              aria-label={`انتخاب گزینه‌های ${product.title}`}
              title="گزینه‌ها"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-foreground-muted transition hover:border-brand hover:text-brand"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
                <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
                <circle cx="18" cy="12" r="2" />
                <circle cx="15" cy="17" r="2" />
              </svg>
            </Link>
          ) : (
            <div className="relative shrink-0">
              {floatLabel ? (
                <span
                  key={floatKey}
                  className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-brand-foreground animate-cart-qty-float"
                  aria-hidden
                >
                  {floatLabel}
                </span>
              ) : null}

              {cartQty > 0 ? (
                <span
                  className={cn(
                    "absolute -end-1 -top-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold leading-none text-background",
                    badgeBump && "animate-cart-badge-pop",
                  )}
                  aria-hidden
                >
                  {faDigits(cartQty)}
                </span>
              ) : null}

              <button
                type="button"
                onClick={handleAdd}
                disabled={outOfStock}
                aria-label={
                  outOfStock
                    ? "ناموجود"
                    : cartQty > 0
                      ? `افزودن ${product.title}، ${faDigits(cartQty)} تا تو سبد`
                      : `افزودن ${product.title} به سبد`
                }
                title={
                  outOfStock
                    ? "ناموجود"
                    : cartQty > 0
                      ? `${faDigits(cartQty)} تو سبد، باز هم`
                      : "بزن به سبد"
                }
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg transition",
                  outOfStock
                    ? "cursor-not-allowed border border-border bg-surface-muted text-foreground-muted"
                    : "bg-brand text-brand-foreground hover:opacity-90",
                  popping && "animate-cart-btn-pop",
                )}
              >
                {outOfStock ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
                    <path d="M5 12h14" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
