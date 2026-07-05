"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { paths } from "@/lib/auth/paths";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import type { PublicProduct } from "@/types/public/store";

type ProductCardProps = {
  product: PublicProduct;
  storeSlug: string;
};

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const { addItem } = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const image = product.images[0];
  const imageUrl = image?.thumbnail_url ?? image?.image_url;
  const href = paths.customer.storeProduct(storeSlug, product.id);

  function handleAdd() {
    if (product.stock_quantity <= 0) {
      toast.error("این محصول ناموجود است");
      return;
    }
    addItem(product, qty);
    toast.success(`«${product.title}» به سبد خرید اضافه شد`);
    setQty(1);
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <Link href={href} className="relative aspect-square bg-surface-muted">
        {product.stock_quantity <= 0 && (
          <div className="absolute start-2 top-2 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow">
            ناموجود
          </div>
        )}
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveMediaUrl(imageUrl)}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
            بدون تصویر
          </div>
        )}
      </Link>
      <CardContent className="flex flex-1 flex-col gap-3 py-4">
        <div className="flex-1">
          <Link href={href}>
            <h3 className="font-semibold text-foreground hover:text-brand">{product.title}</h3>
          </Link>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">{product.description}</p>
          )}
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {product.images.slice(0, 4).map((thumb, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${thumb.image_url}-${index}`}
                    src={resolveMediaUrl(thumb.thumbnail_url ?? thumb.image_url)}
                    alt={thumb.alt_text ?? product.title}
                    className="h-12 w-12 rounded-lg border border-border object-cover"
                  />
                ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground">
            {formatMoney(product.price)}
          </span>
          <span className="text-sm text-foreground-muted">{product.stock_quantity} موجود</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor={`qty-${product.id}`}>
            تعداد
          </label>
          <div className="flex items-center gap-2 self-start rounded-full border border-border px-2 py-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="کاهش تعداد"
              onClick={() => setQty((current) => Math.max(1, current - 1))}
              disabled={qty <= 1}
              className="h-8 w-8 rounded-full p-0"
            >
              -
            </Button>
            <span className="min-w-8 text-center text-sm font-medium">{qty}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="افزایش تعداد"
              onClick={() => setQty((current) => Math.min(product.stock_quantity, current + 1))}
              disabled={qty >= product.stock_quantity}
              className="h-8 w-8 rounded-full p-0"
            >
              +
            </Button>
          </div>
          <Button
            className="w-full sm:flex-1"
            size="sm"
            onClick={handleAdd}
            disabled={product.stock_quantity <= 0}
            variant={product.stock_quantity <= 0 ? "secondary" : "primary"}
          >
            {product.stock_quantity <= 0 ? "ناموجود" : "افزودن به سبد"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
