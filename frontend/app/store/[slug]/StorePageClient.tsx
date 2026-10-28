"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as storesApi from "@/lib/api/public/stores";
import { useCart } from "@/contexts/CartContext";
import { resolveMediaUrl } from "@/lib/media";
import { resolveContactHref } from "@/lib/seller/contactChannels";
import { MessageSellerButton } from "@/components/store/MessageSellerButton";
import { ProductBrowser } from "@/components/store/ProductBrowser";
import { StoreCollapsingCover } from "@/components/store/StoreCollapsingCover";
import { useStoreChrome } from "@/components/store/StoreChromeContext";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Modal } from "@/components/ui/Modal";
import {
  SocialIcon,
  getSocialPlatformLabel,
  type SocialPlatformKey,
} from "@/components/ui/SocialIcon";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrbLoader } from "@/components/ui/OrbLoader";
import { useSectionTravel } from "@/components/ui/SectionTravel";
import type { PublicStorePageResponse } from "@/types/public/store";

type StorePageClientProps = {
  slug: string;
  initialData?: PublicStorePageResponse | null;
  initialError?: string | null;
};

function StorePageChromeSync({
  categories,
  reviewCount,
  onOpenAbout,
  onOpenReviews,
}: {
  categories: PublicStorePageResponse["categories"];
  reviewCount: number;
  onOpenAbout: () => void;
  onOpenReviews: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    setCategories,
    setReviewCount,
    setActiveCategorySlug,
    registerActions,
  } = useStoreChrome();

  const selectCategory = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) params.set("category", slug);
      else params.delete("category");
      params.delete("page");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      setActiveCategorySlug(slug);
    },
    [pathname, router, searchParams, setActiveCategorySlug],
  );

  useEffect(() => {
    setCategories(categories);
    setReviewCount(reviewCount);
  }, [categories, reviewCount, setCategories, setReviewCount]);

  useEffect(() => {
    setActiveCategorySlug(searchParams.get("category"));
  }, [searchParams, setActiveCategorySlug]);

  useEffect(() => {
    registerActions({
      openAbout: onOpenAbout,
      openReviews: onOpenReviews,
      selectCategory,
    });
  }, [onOpenAbout, onOpenReviews, registerActions, selectCategory]);

  return null;
}

export function StorePageClient({ slug, initialData, initialError }: StorePageClientProps) {
  const { reconcileWithProducts } = useCart();
  const { travelTo } = useSectionTravel();
  const [data, setData] = useState<PublicStorePageResponse | null>(initialData ?? null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(!initialData && !initialError);
  const [aboutOpen, setAboutOpen] = useState(false);

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
        if (!cancelled) setError("فروشگاه پیدا نشد یا الان در دسترس نیست.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, initialData, reconcileWithProducts]);

  function openReviews() {
    travelTo(
      () => {
        document.getElementById("store-reviews")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      },
      { state: "connecting", label: "رفتن به نظرها…" },
    );
  }

  function openAbout() {
    travelTo(() => setAboutOpen(true), {
      state: "listening",
      label: "باز کردن معرفی فروشگاه…",
    });
  }

  const activeLinks = useMemo(
    () => (data?.social_links ?? []).filter((link) => link.is_active),
    [data?.social_links],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 py-16">
        <OrbLoader state="weaving" size={64} label="داره فروشگاه رو باز می‌کنه…" />
        <div className="grid w-full max-w-3xl grid-cols-2 gap-2 opacity-40 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} className="mx-auto max-w-xl" />;
  }

  if (!data) {
    return <EmptyState title="فروشگاه پیدا نشد" description="این فروشگاه وجود نداره یا فعلاً بسته‌ست." />;
  }

  const { store, products, categories, review_summary } = data;
  const coverUrl = store.cover_image_url ? resolveMediaUrl(store.cover_image_url) : null;
  const logoUrl = store.logo_url ? resolveMediaUrl(store.logo_url) : null;
  const ratingText = review_summary.average_rating.toFixed(1);

  return (
    <div
      className="space-y-3 sm:space-y-5"
      style={
        store.primary_color
          ? ({ ["--store-primary" as string]: store.primary_color } as React.CSSProperties)
          : undefined
      }
      data-theme={store.theme_preset || "default"}
    >
      <Suspense fallback={null}>
        <StorePageChromeSync
          categories={categories}
          reviewCount={review_summary.review_count}
          onOpenAbout={openAbout}
          onOpenReviews={openReviews}
        />
      </Suspense>

      <StoreCollapsingCover
        storeName={store.name}
        coverUrl={coverUrl}
        logoUrl={logoUrl}
        description={store.description}
        ratingText={ratingText}
        reviewCount={review_summary.review_count}
        onOpenReviews={openReviews}
        onOpenAbout={openAbout}
        trailingAction={<MessageSellerButton storeId={store.id} variant="icon" />}
      />

      <Modal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title="درباره فروشگاه"
        className="max-h-[min(85vh,36rem)] overflow-y-auto sm:max-w-md"
      >
        <div className="space-y-4 text-sm leading-7 text-foreground">
          {store.about_text ? <p className="whitespace-pre-wrap">{store.about_text}</p> : null}
          {store.description ? (
            <p className={store.about_text ? "text-foreground-muted" : undefined}>{store.description}</p>
          ) : null}
          {!store.about_text && !store.description ? (
            <p className="text-foreground-muted">فروشنده هنوز معرفی‌ای ننوشته.</p>
          ) : null}

          {(store.phone || store.website) && (
            <div className="space-y-1.5 border-t border-border/70 pt-3">
              {store.phone ? (
                <p>
                  <span className="text-foreground-muted">تلفن: </span>
                  {store.phone}
                </p>
              ) : null}
              {store.website ? (
                <a
                  href={store.website}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-brand hover:underline"
                >
                  {store.website}
                </a>
              ) : null}
            </div>
          )}

          {activeLinks.length > 0 ? (
            <div className="flex flex-wrap gap-2 border-t border-border/70 pt-3">
              {activeLinks.map((link) => (
                <a
                  key={link.id}
                  href={resolveContactHref((link.icon_key as SocialPlatformKey) || "other", link.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm transition hover:border-brand/40 hover:text-brand"
                >
                  <SocialIcon platform={(link.icon_key as SocialPlatformKey) || "other"} />
                  {link.icon_key
                    ? getSocialPlatformLabel(link.icon_key as SocialPlatformKey)
                    : link.label}
                </a>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
            <MessageSellerButton storeId={store.id} />
            <button
              type="button"
              onClick={() => setAboutOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-foreground-muted transition hover:bg-surface-muted hover:text-foreground"
            >
              بستن
            </button>
          </div>
        </div>
      </Modal>

      <section id="store-products" className="scroll-mt-24 space-y-3">
        <Suspense fallback={null}>
          <ProductBrowser slug={slug} initialProducts={products} categories={categories} />
        </Suspense>
      </section>

      <section
        id="store-reviews"
        className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-surface/80 p-3 sm:space-y-4 sm:rounded-2xl sm:p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-muted text-brand">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-4 w-4">
                <path
                  d="M5.5 18.5 4 21l3.2-1.2A8.5 8.5 0 1 0 5.5 18.5Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.5 10.5h7M8.5 13.5h4.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">نظر خریداران</h2>
              <p className="mt-0.5 text-sm text-foreground-muted">
                میانگین {ratingText} از {review_summary.review_count} نظر
              </p>
            </div>
          </div>
          <Badge variant="success">{review_summary.review_count} نظر</Badge>
        </div>

        {review_summary.recent_reviews.length === 0 ? (
          <EmptyState
            title="هنوز نظری نیامده"
            description="اولین خریدارها که نظر بدن، اینجا نشون داده می‌شه."
          />
        ) : (
          <div className="space-y-3">
            {review_summary.recent_reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{review.customer_name}</p>
                  <Badge variant="success">{review.rating} / 5</Badge>
                </div>
                {review.title ? (
                  <p className="mt-2 text-sm font-medium text-foreground">{review.title}</p>
                ) : null}
                {review.comment ? (
                  <p className="mt-1 text-sm leading-6 text-foreground-muted">{review.comment}</p>
                ) : null}
                {review.image_urls.length > 0 ? (
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
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
