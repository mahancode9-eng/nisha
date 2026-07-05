"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as storesApi from "@/lib/api/public/stores";
import { ProductCard } from "@/components/store/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import type {
  ProductSortKey,
  PublicProduct,
  PublicProductListResponse,
} from "@/types/public/store";

type ProductBrowserProps = {
  slug: string;
  initialProducts: PublicProduct[];
};

const SORT_OPTIONS: { value: ProductSortKey; label: string }[] = [
  { value: "newest", label: "جدیدترین" },
  { value: "cheapest", label: "ارزان‌ترین" },
  { value: "most_expensive", label: "گران‌ترین" },
  { value: "best_selling", label: "پرفروش‌ترین" },
];

const FIELD_CLASSES =
  "rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand";

/**
 * Storefront product browser (roadmap task 14).
 *
 * Search, price/stock filters, sorting and pagination. The whole state lives
 * in the URL query string so the page stays shareable; the component reads
 * the URL as its single source of truth and only writes to it on user input.
 */
export function ProductBrowser({ slug, initialProducts }: ProductBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const minPrice = searchParams.get("min") ?? "";
  const maxPrice = searchParams.get("max") ?? "";
  const inStock = searchParams.get("stock") === "1";
  const sortParam = searchParams.get("sort");
  const sort: ProductSortKey = SORT_OPTIONS.some((option) => option.value === sortParam)
    ? (sortParam as ProductSortKey)
    : "newest";
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);

  // With no active search/filter/sort the initial SSR product list is shown
  // as-is and no extra request is made.
  const isDefaultView = !q && !minPrice && !maxPrice && !inStock && sort === "newest" && page === 1;

  const [searchText, setSearchText] = useState(q);
  const [minText, setMinText] = useState(minPrice);
  const [maxText, setMaxText] = useState(maxPrice);
  const [result, setResult] = useState<PublicProductListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      if (resetPage) {
        params.delete("page");
      }
      const query = params.toString();
      router.replace(query ? pathname + "?" + query : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  // Debounce the search box into the URL.
  useEffect(() => {
    if (searchText === q) {
      return;
    }
    const timer = setTimeout(() => {
      updateParams({ q: searchText || null });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText, q, updateParams]);

  function commitPrices() {
    updateParams({ min: minText || null, max: maxText || null });
  }

  useEffect(() => {
    if (isDefaultView) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    storesApi
      .searchStoreProducts(slug, {
        q: q || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        in_stock: inStock || undefined,
        sort,
        page,
      })
      .then((data) => {
        if (!cancelled) {
          setResult(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("جستجوی محصولات ناموفق بود. دوباره تلاش کن.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, q, minPrice, maxPrice, inStock, sort, page, isDefaultView]);

  const products = isDefaultView ? initialProducts : (result?.items ?? []);
  const total = isDefaultView ? initialProducts.length : (result?.total ?? 0);
  const pageSize = result?.page_size || 24;
  const totalPages = isDefaultView ? 1 : Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:flex-row md:flex-wrap md:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="product-search" className="mb-1 block text-xs font-medium text-foreground-muted">
            جستجو در محصولات
          </label>
          <input
            id="product-search"
            type="search"
            dir="rtl"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="مثلا: کیف چرم"
            className={"w-full " + FIELD_CLASSES}
          />
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="min-price" className="mb-1 block text-xs font-medium text-foreground-muted">
              حداقل قیمت
            </label>
            <input
              id="min-price"
              type="number"
              inputMode="numeric"
              min={0}
              value={minText}
              onChange={(event) => setMinText(event.target.value)}
              onBlur={commitPrices}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commitPrices();
                }
              }}
              className={"w-28 " + FIELD_CLASSES}
            />
          </div>
          <div>
            <label htmlFor="max-price" className="mb-1 block text-xs font-medium text-foreground-muted">
              حداکثر قیمت
            </label>
            <input
              id="max-price"
              type="number"
              inputMode="numeric"
              min={0}
              value={maxText}
              onChange={(event) => setMaxText(event.target.value)}
              onBlur={commitPrices}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commitPrices();
                }
              }}
              className={"w-28 " + FIELD_CLASSES}
            />
          </div>
        </div>
        <div>
          <label htmlFor="product-sort" className="mb-1 block text-xs font-medium text-foreground-muted">
            مرتب‌سازی
          </label>
          <select
            id="product-sort"
            value={sort}
            onChange={(event) =>
              updateParams({ sort: event.target.value === "newest" ? null : event.target.value })
            }
            className={FIELD_CLASSES}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(event) => updateParams({ stock: event.target.checked ? "1" : null })}
            className="h-4 w-4 rounded border-border"
          />
          فقط کالاهای موجود
        </label>
      </div>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="محصولی پیدا نشد"
          description="عبارت جستجو یا فیلترها را تغییر بده."
        />
      ) : (
        <>
          {!isDefaultView && (
            <p className="text-sm text-foreground-muted">{total} محصول پیدا شد</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} storeSlug={slug} />
            ))}
          </div>
        </>
      )}

      {!isDefaultView && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => updateParams({ page: page <= 2 ? null : String(page - 1) }, false)}
            className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-surface-muted disabled:opacity-40"
          >
            قبلی
          </button>
          <span className="text-sm text-foreground-muted">
            صفحه {page} از {totalPages}
          </span>
          <button
            type="button"
            disabled={!result?.has_more || loading}
            onClick={() => updateParams({ page: String(page + 1) }, false)}
            className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-surface-muted disabled:opacity-40"
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
