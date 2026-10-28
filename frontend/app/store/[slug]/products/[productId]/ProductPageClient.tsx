"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
import * as storesApi from "@/lib/api/public/stores";
import { useCart } from "@/contexts/CartContext";
import { resolveMediaUrl } from "@/lib/media";
import { MessageSellerButton } from "@/components/store/MessageSellerButton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { OrbLoader } from "@/components/ui/OrbLoader";
import { useToast } from "@/contexts/ToastContext";
import { formatMoney, formatDateTime } from "@/lib/format";
import { paths } from "@/lib/auth/paths";
import { cn } from "@/lib/cn";
import type { PublicProductDetailResponse } from "@/types/public/store";

type ProductPageClientProps = {
  slug: string;
  productId: number;
};

type GalleryMediaItem =
  | { kind: "image"; key: string; fullUrl: string; previewUrl: string; alt: string | null }
  | { kind: "video"; key: string; srcUrl: string };

export function ProductPageClient({ slug, productId }: ProductPageClientProps) {
  const { addItem } = useCart();
  const toast = useToast();
  const [data, setData] = useState<PublicProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await storesApi.getProductBySlug(slug, productId);
        if (!cancelled) {
          setData(result);
          setSelectedImage(0);
          setQuantity(1);
          setSelectedVariantId(null);
          setLightboxOpen(false);
          setDescOpen(false);
        }
      } catch {
        if (!cancelled) setError("محصول پیدا نشد یا الان در دسترس نیست.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, productId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-16">
        <OrbLoader state="searching" size={64} label="داره محصول رو باز می‌کنه…" />
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} className="mx-auto max-w-xl" />;
  }

  if (!data) {
    return (
      <EmptyState title="محصول در دسترس نیست" description="این محصول حذف شده یا فعلاً فروخته نمی‌شه." />
    );
  }

  const { store, product, review_summary, public_reviews } = data;
  const variants = product.variants ?? [];
  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) ??
    variants.find((v) => v.stock_quantity > 0) ??
    variants[0] ??
    null;
  const effectiveStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const effectivePrice = selectedVariant?.price_override ?? product.price;
  const outOfStock = effectiveStock <= 0;

  const mediaItems: GalleryMediaItem[] = product.images.map((item) => ({
    kind: "image" as const,
    key: `image-${item.id}`,
    fullUrl: resolveMediaUrl(item.image_url),
    previewUrl: resolveMediaUrl(item.thumbnail_url ?? item.image_url),
    alt: item.alt_text,
  }));
  if (product.video_url) {
    mediaItems.push({ kind: "video", key: "product-video", srcUrl: resolveMediaUrl(product.video_url) });
  }

  const activeIndex = mediaItems.length > 0 ? Math.min(selectedImage, mediaItems.length - 1) : 0;
  const activeMedia = mediaItems[activeIndex] ?? null;
  const longDescription = (product.description?.length ?? 0) > 160;

  function goToMedia(index: number) {
    if (mediaItems.length < 2) return;
    setSelectedImage((index + mediaItems.length) % mediaItems.length);
  }

  function handleGalleryTouchStart(event: ReactTouchEvent<HTMLElement>) {
    if ((event.target as HTMLElement).tagName === "VIDEO") return;
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleGalleryTouchEnd(event: ReactTouchEvent<HTMLElement>) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null || mediaItems.length < 2) return;
    if ((event.target as HTMLElement).tagName === "VIDEO") return;
    const endX = event.changedTouches[0]?.clientX ?? startX;
    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 40) return;
    goToMedia(deltaX < 0 ? activeIndex + 1 : activeIndex - 1);
  }

  function handleAddToCart() {
    if (outOfStock) {
      toast.error("این محصول ناموجوده");
      return;
    }
    if (variants.length > 0 && !selectedVariant) {
      toast.error("اول یکی از گزینه‌ها رو انتخاب کن");
      return;
    }
    addItem(product, quantity, selectedVariant);
    toast.success(
      selectedVariant
        ? `«${product.title}، ${selectedVariant.name}» رفت تو سبد`
        : "رفت تو سبد",
    );
  }

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `${paths.store(slug)}/products/${productId}`;
    const shareText = `${product.title} — ${formatMoney(effectivePrice)}`;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: product.title, text: shareText, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint("لینک کپی شد");
      toast.success("لینک محصول کپی شد");
      window.setTimeout(() => setShareHint(null), 2500);
    } catch {
      /* user cancelled share sheet */
    }
  }

  return (
    <div className="mx-auto max-w-5xl pb-24 lg:pb-6">
      <Link
        href={paths.store(slug)}
        className="mb-3 inline-flex items-center gap-1 text-sm text-foreground-muted transition hover:text-foreground"
      >
        <span aria-hidden>→</span>
        برگرد به {store.name}
      </Link>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10 lg:items-start">
        {/* Gallery */}
        <div className="min-w-0">
          <div
            className="relative overflow-hidden rounded-2xl bg-surface-muted"
            onTouchStart={handleGalleryTouchStart}
            onTouchEnd={handleGalleryTouchEnd}
          >
            {activeMedia ? (
              activeMedia.kind === "image" ? (
                <button
                  type="button"
                  className="block aspect-square w-full cursor-zoom-in"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="بزرگ‌نمایی"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeMedia.previewUrl}
                    alt={activeMedia.alt ?? product.title}
                    className="h-full w-full object-cover"
                  />
                </button>
              ) : (
                <video
                  src={activeMedia.srcUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-square w-full bg-black object-contain"
                />
              )
            ) : (
              <div className="flex aspect-square items-center justify-center text-sm text-foreground-muted">
                بدون تصویر
              </div>
            )}

            {mediaItems.length > 1 ? (
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                {mediaItems.map((item, index) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-label={`رسانه ${index + 1}`}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/50",
                    )}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {mediaItems.length > 1 ? (
            <div className="mt-2.5 hidden gap-2 overflow-x-auto pb-0.5 lg:flex">
              {mediaItems.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2",
                    index === activeIndex ? "border-brand" : "border-transparent opacity-70",
                  )}
                >
                  {item.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-neutral-900 text-[10px] text-white">
                      ویدیو
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Buy panel */}
        <div className="min-w-0 space-y-5">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {product.title}
              </h1>
              <button
                type="button"
                onClick={() => void handleShare()}
                className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-sm text-foreground-muted transition hover:border-brand/40 hover:text-foreground"
              >
                اشتراک‌گذاری
              </button>
            </div>
            {shareHint ? (
              <p className="text-xs text-brand" role="status">
                {shareHint}
              </p>
            ) : null}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-2xl font-semibold text-foreground">{formatMoney(effectivePrice)}</p>
              <p
                className={cn(
                  "text-sm",
                  outOfStock ? "text-red-600 dark:text-red-400" : "text-foreground-muted",
                )}
              >
                {outOfStock ? "ناموجود" : `${effectiveStock} عدد موجود`}
              </p>
            </div>
            {review_summary.review_count > 0 ? (
              <p className="text-sm text-foreground-muted">
                ★ {review_summary.average_rating.toFixed(1)} · {review_summary.review_count} نظر
              </p>
            ) : null}
          </div>

          {product.description ? (
            <div className="space-y-1">
              <p
                className={cn(
                  "text-sm leading-7 text-foreground-muted whitespace-pre-wrap",
                  !descOpen && longDescription && "line-clamp-3",
                )}
              >
                {product.description}
              </p>
              {longDescription ? (
                <button
                  type="button"
                  className="text-sm font-medium text-brand"
                  onClick={() => setDescOpen((open) => !open)}
                >
                  {descOpen ? "کمتر" : "بیشتر"}
                </button>
              ) : null}
            </div>
          ) : null}

          {variants.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">گزینه</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => {
                  const active = selectedVariant?.id === variant.id;
                  const soldOut = variant.stock_quantity <= 0;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={soldOut}
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setQuantity(1);
                      }}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-sm transition",
                        active
                          ? "border-brand bg-brand/10 font-medium text-foreground"
                          : "border-border text-foreground hover:border-brand/50",
                        soldOut && "cursor-not-allowed opacity-40",
                      )}
                    >
                      {variant.name}
                      {soldOut ? " · ناموجود" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Desktop purchase controls */}
          <div className="hidden space-y-3 rounded-xl border border-border bg-surface p-4 lg:block">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground-muted">تعداد</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={quantity <= 1 || outOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="کاهش"
                >
                  −
                </Button>
                <span className="min-w-8 text-center text-sm font-medium" aria-live="polite">
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={outOfStock || quantity >= effectiveStock}
                  onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))}
                  aria-label="افزایش"
                >
                  +
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={handleAddToCart} disabled={outOfStock}>
              {outOfStock ? "ناموجود" : "بزن به سبد"}
            </Button>
            <div className="flex justify-center">
              <MessageSellerButton storeId={store.id} />
            </div>
          </div>

          {product.form_fields.length > 0 ? (
            <p className="text-xs text-foreground-muted">
              موقع ثبت سفارش، {product.form_fields.length} سؤال کوتاه درباره سفارش ازت می‌پرسیم.
            </p>
          ) : null}

          <div className="lg:hidden">
            <MessageSellerButton storeId={store.id} />
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-10 space-y-4 border-t border-border pt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">نظرها</h2>
          {review_summary.review_count > 0 ? (
            <p className="text-sm text-foreground-muted">
              ★ {review_summary.average_rating.toFixed(1)} · {review_summary.review_count} نظر
            </p>
          ) : null}
        </div>

        {public_reviews.length === 0 ? (
          <p className="text-sm text-foreground-muted">هنوز کسی درباره این محصول نظر نداده.</p>
        ) : (
          <ul className="space-y-4">
            {public_reviews.map((review) => (
              <li key={review.id} className="border-b border-border/70 pb-4 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{review.customer_name}</p>
                  <p className="text-xs text-foreground-muted">★ {review.rating}</p>
                </div>
                <p className="mt-0.5 text-xs text-foreground-muted">{formatDateTime(review.created_at)}</p>
                {review.title ? (
                  <p className="mt-2 text-sm font-medium text-foreground">{review.title}</p>
                ) : null}
                {review.comment ? (
                  <p className="mt-1 text-sm leading-6 text-foreground-muted">{review.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-border px-1">
            <button
              type="button"
              className="px-2.5 py-2 text-lg leading-none text-foreground disabled:opacity-40"
              disabled={quantity <= 1 || outOfStock}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="کاهش"
            >
              −
            </button>
            <span className="min-w-6 text-center text-sm font-medium">{quantity}</span>
            <button
              type="button"
              className="px-2.5 py-2 text-lg leading-none text-foreground disabled:opacity-40"
              disabled={outOfStock || quantity >= effectiveStock}
              onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))}
              aria-label="افزایش"
            >
              +
            </button>
          </div>
          <Button className="min-w-0 flex-1" onClick={handleAddToCart} disabled={outOfStock}>
            {outOfStock ? "ناموجود" : `بزن به سبد · ${formatMoney(parseFloat(effectivePrice) * quantity)}`}
          </Button>
        </div>
      </div>

      {lightboxOpen && activeMedia?.kind === "image" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxOpen(false)}
          onTouchStart={handleGalleryTouchStart}
          onTouchEnd={handleGalleryTouchEnd}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeMedia.fullUrl}
            alt={activeMedia.alt ?? product.title}
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            className="absolute end-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-sm text-neutral-900"
            onClick={() => setLightboxOpen(false)}
          >
            بستن
          </button>
        </div>
      ) : null}
    </div>
  );
}
