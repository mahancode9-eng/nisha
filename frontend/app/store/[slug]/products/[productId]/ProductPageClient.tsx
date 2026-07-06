"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
import * as storesApi from "@/lib/api/public/stores";
import { useCart } from "@/contexts/CartContext";
import { resolveMediaUrl } from "@/lib/media";
import { MessageSellerButton } from "@/components/store/MessageSellerButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { formatMoney, formatDateTime } from "@/lib/format";
import { paths } from "@/lib/auth/paths";
import type { PublicProductDetailResponse } from "@/types/public/store";

type ProductPageClientProps = {
  slug: string;
  productId: number;
};

type GalleryMediaItem =
  | { kind: "image"; key: string; fullUrl: string; previewUrl: string; alt: string | null }
  | { kind: "video"; key: string; srcUrl: string };

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: "متن کوتاه",
  TEXTAREA: "متن بلند",
  NUMBER: "عدد",
  DROPDOWN: "فهرست کشویی",
  RADIO: "گزینه‌های رادیویی",
  CHECKBOX: "چک‌باکس",
  FILE_UPLOAD: "بارگذاری فایل",
};

export function ProductPageClient({ slug, productId }: ProductPageClientProps) {
  const { addItem } = useCart();
  const toast = useToast();
  const [data, setData] = useState<PublicProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
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
          setLightboxOpen(false);
        }
      } catch {
        if (!cancelled) setError("محصول پیدا نشد یا در دسترس نیست.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, productId]);

  const badges = useMemo(
    () => data?.store.trust_badges ?? [],
    [data?.store.trust_badges],
  );

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[520px] w-full rounded-3xl" />
        <Skeleton className="h-[520px] w-full rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} className="mx-auto max-w-xl" />;
  }

  if (!data) {
    return (
      <EmptyState
        title="محصول در دسترس نیست"
        description="این محصول وجود ندارد یا فعال نیست."
      />
    );
  }

  const { store, product, review_summary, public_reviews } = data;

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
  const lineTotal = parseFloat(product.price) * quantity;

  function goToMedia(index: number) {
    if (mediaItems.length < 2) return;
    const next = (index + mediaItems.length) % mediaItems.length;
    setSelectedImage(next);
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
    if (deltaX < 0) {
      goToMedia(activeIndex + 1);
    } else {
      goToMedia(activeIndex - 1);
    }
  }

  function handleAddToCart() {
    addItem(product, quantity);
    toast.success("محصول به سبد خرید اضافه شد");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
        <Link href={paths.store(slug)} className="text-brand hover:underline">
          بازگشت به فروشگاه
        </Link>
        <span>•</span>
        <span>{store.name}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <CardContent className="space-y-4 p-4">
            <div
              className="relative overflow-hidden rounded-3xl bg-neutral-100"
              onTouchStart={handleGalleryTouchStart}
              onTouchEnd={handleGalleryTouchEnd}
            >
              {activeMedia ? (
                activeMedia.kind === "image" ? (
                  <button
                    type="button"
                    className="block h-[280px] w-full cursor-zoom-in sm:h-[420px]"
                    onClick={() => setLightboxOpen(true)}
                    aria-label="بزرگ‌نمایی تصویر"
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
                    className="h-[280px] w-full bg-black object-contain sm:h-[420px]"
                  />
                )
              ) : (
                <div className="flex h-[280px] items-center justify-center text-neutral-400 sm:h-[420px]">
                  تصویری در دسترس نیست
                </div>
              )}
              {mediaItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goToMedia(activeIndex - 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-1.5 text-sm text-white hover:bg-black/60"
                    aria-label="مورد قبلی گالری"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => goToMedia(activeIndex + 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-1.5 text-sm text-white hover:bg-black/60"
                    aria-label="مورد بعدی گالری"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs text-white">
                    {activeIndex + 1} / {mediaItems.length}
                  </div>
                </>
              )}
            </div>
            {mediaItems.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {mediaItems.map((item, index) => {
                  const active = index === activeIndex;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                        active ? "border-brand" : "border-transparent"
                      }`}
                    >
                      {item.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.previewUrl} alt={item.alt ?? product.title} className="h-20 w-20 object-cover" />
                      ) : (
                        <span className="flex h-20 w-20 items-center justify-center bg-neutral-900 text-xs font-medium text-white">
                          ▶ ویدیو
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 py-6">
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <Badge key={badge} variant="info">
                    {badge}
                  </Badge>
                ))}
              </div>
              <div>
                <p className="text-sm text-foreground-muted">{store.name}</p>
                <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">{product.title}</h1>
                <p className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">{formatMoney(product.price)}</p>
              </div>
              {product.description && <p className="text-sm leading-6 text-foreground-muted">{product.description}</p>}
              <div className="space-y-3 rounded-3xl border border-border bg-surface-muted p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs tracking-[0.2em] text-foreground-muted">تعداد</p>
                    <p className="text-sm text-foreground-muted">پیش از افزودن به سبد خرید، مقدار را تنظیم کنید.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      disabled={quantity <= 1}
                      aria-label="کاهش تعداد"
                    >
                      -
                    </Button>
                    <div className="min-w-14 rounded-full border border-border bg-surface px-4 py-2 text-center text-sm font-medium text-foreground" aria-live="polite">
                      {quantity}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => setQuantity((current) => Math.min(product.stock_quantity, current + 1))}
                      disabled={quantity >= product.stock_quantity}
                      aria-label="افزایش تعداد"
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">جمع این ردیف</span>
                  <span className="font-semibold text-foreground">{formatMoney(lineTotal)}</span>
                </div>
                <Button onClick={handleAddToCart} disabled={product.stock_quantity <= 0}>
                  افزودن به سبد خرید
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <MessageSellerButton storeId={store.id} />
                <Link href={paths.customer.checkout(slug)} className="inline-flex items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90">
                  رفتن به پرداخت
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 py-6">
              <p className="text-xs tracking-[0.2em] text-foreground-muted">جزئیات محصول</p>
              <div className="grid gap-3 text-sm text-foreground">
                <p>
                  موجودی: <span className="font-medium text-foreground">{product.stock_quantity}</span>
                </p>
                <p>
                  تصاویر: <span className="font-medium text-foreground">{product.image_count}</span>
                </p>
                {product.video_url && (
                  <p>
                    ویدیو: <span className="font-medium text-foreground">دارد</span>
                  </p>
                )}
                {product.form_fields.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">فیلدهای سفارش سفارشی</p>
                    <div className="space-y-2">
                      {product.form_fields.map((field) => (
                        <div key={field.id} className="rounded-xl border border-border p-3">
                          <p className="font-medium text-foreground">{field.label}</p>
                          <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
                            {FIELD_TYPE_LABELS[field.field_type] ?? field.field_type} {field.is_required ? "• الزامی" : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardContent className="space-y-4 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-[0.2em] text-foreground-muted">نظرات عمومی</p>
                  <h2 className="text-xl font-semibold text-foreground">
                    میانگین {review_summary.average_rating.toFixed(1)} از {review_summary.review_count} خریدار
                  </h2>
                </div>
                <Badge variant="success">{review_summary.review_count} نظر</Badge>
              </div>
              <div className="space-y-3">
              {public_reviews.length === 0 ? (
                <EmptyState title="هنوز نظری ثبت نشده" description="برای این محصول هیچ نظر تاییدشده‌ای وجود ندارد." />
                ) : (
                  public_reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{review.customer_name}</p>
                      <Badge variant="success">{review.rating} / 5</Badge>
                    </div>
                    <p className="mt-1 text-xs text-foreground-muted">{formatDateTime(review.created_at)}</p>
                    {review.title && <p className="mt-2 font-medium text-foreground">{review.title}</p>}
                    {review.comment && <p className="mt-1 text-sm leading-6 text-foreground-muted">{review.comment}</p>}
                    {review.image_urls.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto">
                        {review.image_urls.map((imageUrlItem) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={imageUrlItem}
                            src={resolveMediaUrl(imageUrlItem)}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="text-xs tracking-[0.2em] text-foreground-muted">نمای کلی فروشگاه</p>
            <p className="text-lg font-semibold text-foreground">{store.name}</p>
            {store.description && <p className="text-sm leading-6 text-foreground-muted">{store.description}</p>}
            {store.location && <p className="text-sm text-foreground">موقعیت: {store.location}</p>}
            {store.phone && <p className="text-sm text-foreground">تلفن: {store.phone}</p>}
            {store.website && (
              <a href={store.website} target="_blank" rel="noreferrer" className="text-sm text-brand hover:underline">
                وب‌سایت
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {lightboxOpen && activeMedia?.kind === "image" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
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
            className="max-h-full max-w-full rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
            onClick={() => setLightboxOpen(false)}
          >
            بستن ✕
          </button>
        </div>
      )}
    </div>
  );
}
