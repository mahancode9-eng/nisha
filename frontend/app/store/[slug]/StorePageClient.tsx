"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as storesApi from "@/lib/api/public/stores";
import { useCart } from "@/contexts/CartContext";
import { resolveMediaUrl } from "@/lib/media";
import { resolveContactHref } from "@/lib/seller/contactChannels";
import { findSellerStoreCategory } from "@/lib/seller/storeCategories";
import { MessageSellerButton } from "@/components/store/MessageSellerButton";
import { ProductCard } from "@/components/store/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import {
  SocialIcon,
  getSocialPlatformLabel,
  type SocialPlatformKey,
} from "@/components/ui/SocialIcon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import type { PublicStorePageResponse } from "@/types/public/store";

type StorePageClientProps = {
  slug: string;
  initialData?: PublicStorePageResponse | null;
  initialError?: string | null;
};

type StoreSectionKey = "products" | "reviews" | "about";

const STORE_SECTION_ITEMS: { key: StoreSectionKey; label: string }[] = [
  { key: "products", label: "محصولات" },
  { key: "reviews", label: "نظرات" },
  { key: "about", label: "درباره" },
];

function isVerifiedBadge(badge: string): boolean {
  return badge.trim().toUpperCase() === "VERIFIED";
}

function formatTrustBadgeLabel(badge: string): string {
  return badge
    .trim()
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function VerifiedTick() {
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm ring-2 ring-white/15"
      aria-label="فروشگاه تاییدشده"
      title="فروشگاه تاییدشده"
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3.5 w-3.5">
        <path d="M4.5 10.5 8.1 14l7.4-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function StorePageClient({ slug, initialData, initialError }: StorePageClientProps) {
  const { reconcileWithProducts } = useCart();
  const [data, setData] = useState<PublicStorePageResponse | null>(initialData ?? null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(!initialData && !initialError);
  const [activeSection, setActiveSection] = useState<StoreSectionKey>("products");
  const productsSectionRef = useRef<HTMLElement | null>(null);
  const reviewsSectionRef = useRef<HTMLElement | null>(null);
  const aboutSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (initialData) {
      reconcileWithProducts(initialData.products);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const store = await storesApi.getStoreBySlug(slug);
        if (!cancelled) {
          setData(store);
          reconcileWithProducts(store.products);
        }
      } catch {
        if (!cancelled) setError("فروشگاه پیدا نشد یا در دسترس نیست.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, initialData, reconcileWithProducts]);

  const activeLinks = useMemo(
    () => (data?.social_links ?? []).filter((link) => link.is_active),
    [data?.social_links],
  );

  const storeTrustBadges = useMemo(() => {
    const badges = data?.store.trust_badges ?? [];
    return badges.filter((badge) => !isVerifiedBadge(badge));
  }, [data?.store.trust_badges]);

  const verifiedStore = useMemo(
    () => (data?.store.trust_badges ?? []).some(isVerifiedBadge),
    [data?.store.trust_badges],
  );

  function scrollToSection(section: StoreSectionKey) {
    setActiveSection(section);
    const target =
      section === "products"
        ? productsSectionRef.current
        : section === "reviews"
          ? reviewsSectionRef.current
          : aboutSectionRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-full max-w-2xl" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
              ))}
            </div>
          </div>
          <Skeleton className="min-h-[520px] w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} className="mx-auto max-w-xl" />;
  }

  if (!data) {
    return <EmptyState title="فروشگاه پیدا نشد" description="این فروشگاه وجود ندارد یا فعال نیست." />;
  }

  const { store, products, review_summary } = data;
  const coverUrl = store.cover_image_url ? resolveMediaUrl(store.cover_image_url) : null;
  const logoUrl = store.logo_url ? resolveMediaUrl(store.logo_url) : null;
  const ratingText = review_summary.average_rating.toFixed(1);
  const categoryLabel = store.category_name ?? findSellerStoreCategory(store.category_slug)?.label ?? null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-sm">
        <div className="relative overflow-hidden bg-neutral-950 text-white">
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={`کاور ${store.name}`} className="absolute inset-0 h-full w-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/95 via-neutral-950/78 to-neutral-950/70" />
          <div className="relative px-5 py-5 md:px-8 md:py-6">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-4">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={store.name}
                    className="h-12 w-12 rounded-xl border border-white/20 bg-white object-cover shadow-lg md:h-14 md:w-14"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-base font-semibold md:h-14 md:w-14">
                    {store.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{store.name}</h1>
                    {verifiedStore && <VerifiedTick />}
                    {categoryLabel && <Badge className="bg-white/10 text-white">{categoryLabel}</Badge>}
                    <Badge className="bg-white/10 text-white">میانگین {ratingText}</Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <MessageSellerButton storeId={store.id} />
                  {store.website && (
                    <a
                      href={resolveContactHref("website", store.website)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                    >
                      وب‌سایت
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => scrollToSection("reviews")}
                    className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                  >
                    نظرات
                  </button>
                </div>
              </div>
              {store.description && (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
                  {store.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {storeTrustBadges.map((badge) => (
          <Card key={badge} className="border-border">
            <CardContent className="flex items-center gap-3 py-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-muted text-sky-600">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
                  <path
                    d="M10 2.8 16.2 6v6.2c0 2.8-2 5.3-6.2 5.9-4.2-.6-6.2-3.1-6.2-5.9V6L10 2.8Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="m7.5 10.3 1.8 1.8 3.8-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="font-semibold text-foreground">{formatTrustBadgeLabel(badge)}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Tabs
        items={STORE_SECTION_ITEMS.map((item) => ({
          ...item,
          label:
            item.key === "products"
              ? `محصولات (${products.length})`
              : item.key === "reviews"
                ? `نظرات (${review_summary.review_count})`
                : item.label,
        }))}
        activeKey={activeSection}
        onChange={(key) => scrollToSection(key as StoreSectionKey)}
      />

      {activeSection === "products" && (
        <section ref={productsSectionRef} id="products" className="scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">محصولات</h2>

            </div>
            <Badge variant="info">{products.length} موجود</Badge>
          </div>

          {products.length === 0 ? (
            <EmptyState title="محصولی موجود نیست" description="بعدا دوباره بررسی کنید." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} storeSlug={slug} />
              ))}
            </div>
          )}
        </section>
      )}

      {activeSection === "reviews" && (
        <section ref={reviewsSectionRef} id="reviews" className="scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">نظرات</h2>
              <p className="mt-1 text-sm text-foreground-muted">
                میانگین امتیاز و بازخوردهای اخیر خریداران اینجا نمایش داده می‌شود.
              </p>
            </div>
            <Badge variant="success">{review_summary.review_count} نظر</Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <CardContent className="space-y-4 py-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-[0.2em] text-foreground-muted">میانگین امتیاز</p>
                    <p className="mt-2 text-5xl font-bold text-foreground">{ratingText}</p>
                    <p className="mt-1 text-sm text-foreground-muted">
                      بر اساس {review_summary.review_count} نظر عمومی
                    </p>
                  </div>
                  <Badge variant="info">نظرات اخیر</Badge>
                </div>

                <div className="space-y-3">
                  {review_summary.recent_reviews.length === 0 ? (
                    <EmptyState
                      title="هنوز نظری ثبت نشده"
                      description="این فروشگاه هنوز نظر عمومی تاییدشده‌ای ندارد."
                    />
                  ) : (
                    review_summary.recent_reviews.map((review) => (
                      <div key={review.id} className="rounded-2xl border border-border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-foreground">{review.customer_name}</p>
                          <Badge variant="success">{review.rating} / 5</Badge>
                        </div>
                        {review.title && <p className="mt-2 text-sm font-medium text-foreground">{review.title}</p>}
                        {review.comment && <p className="mt-1 text-sm leading-6 text-foreground-muted">{review.comment}</p>}
                        {review.image_urls.length > 0 && (
                          <div className="mt-3 flex gap-2 overflow-x-auto">
                            {review.image_urls.map((image) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={image}
                                src={resolveMediaUrl(image)}
                                alt={`تصویر نظر ${review.customer_name}`}
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
              <CardContent className="space-y-4 py-6">
                <div>
                  <p className="text-xs tracking-[0.2em] text-foreground-muted">خلاصه نظرات</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{ratingText}</p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    میانگین امتیاز و تعداد نظرات نمایش داده می‌شود.
                  </p>
                </div>
                <div className="space-y-2">
                  {[
                    `میانگین امتیاز: ${ratingText}`,
                    `تعداد نظرات: ${review_summary.review_count}`,
                  ].map((item) => (
                    <div key={item} className="rounded-2xl bg-surface-muted px-4 py-3 text-sm text-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {activeSection === "about" && (
        <section ref={aboutSectionRef} id="about" className="scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">درباره فروشگاه</h2>
              <p className="mt-1 text-sm text-foreground-muted">
                جزئیات فروشگاه، راه‌های ارتباطی و لینک‌های اجتماعی.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardContent className="space-y-5 py-6">
                <div>
                  <p className="text-xs tracking-[0.2em] text-foreground-muted">جزئیات فروشگاه</p>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-foreground">
                    {store.description && <p>{store.description}</p>}
                    {store.location && <p>موقعیت: {store.location}</p>}
                    {store.phone && <p>تلفن: {store.phone}</p>}
                    {store.support_contact && <p>پشتیبانی: {store.support_contact}</p>}
                    {store.website && (
                      <p>
                        وب‌سایت:{" "}
                        <a href={store.website} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                          {store.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 py-6">
                <div>
                  <p className="text-xs tracking-[0.2em] text-foreground-muted">لینک‌های اجتماعی</p>
                  <div className="mt-3 space-y-2">
                    {activeLinks.length === 0 ? (
                      <p className="text-sm text-foreground-muted">لینک اجتماعی تنظیم نشده است.</p>
                    ) : (
                      activeLinks.map((link) => (
                        <a
                          key={link.id}
                          href={resolveContactHref((link.icon_key as SocialPlatformKey) || "other", link.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-2xl border border-border px-3 py-3 text-sm text-foreground transition hover:border-brand/40 hover:bg-brand/5"
                        >
                          <SocialIcon
                            platform={(link.icon_key as SocialPlatformKey) || "other"}
                            className="text-foreground"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">
                              {link.icon_key
                                ? getSocialPlatformLabel(link.icon_key as SocialPlatformKey)
                                : link.label}
                            </p>
                            <p className="truncate text-xs text-foreground-muted">{link.url}</p>
                          </div>
                        </a>
                      ))
                    )}
                  </div>
                </div>

                {storeTrustBadges.length > 0 && (
                  <div>
                    <p className="text-xs tracking-[0.2em] text-foreground-muted">نشان‌های اعتماد</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {storeTrustBadges.map((badge) => (
                        <Badge key={badge} variant="info">
                          {formatTrustBadgeLabel(badge)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
