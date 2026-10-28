"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as storesApi from "@/lib/api/public/stores";
import { resolveMediaUrl } from "@/lib/media";
import { resolveContactHref } from "@/lib/seller/contactChannels";
import { formatMoney } from "@/lib/format";
import { paths } from "@/lib/auth/paths";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import type { PublicStorePageResponse } from "@/types/public/store";

export function BioLinksClient({ slug }: { slug: string }) {
  const [data, setData] = useState<PublicStorePageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const page = await storesApi.getStoreBySlug(slug);
        if (!cancelled) setData(page);
      } catch {
        if (!cancelled) setError("فروشگاه پیدا نشد یا هنوز منتشر نشده.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <ErrorAlert message={error} />
      </div>
    );
  }
  if (!data) return <LoadingState label="داره لود می‌شه…" />;

  const { store, products, social_links } = data;
  const brand = store.primary_color || "#3d2a1f";
  const topProducts = (products || []).slice(0, 6);
  const contacts = [
    store.phone ? { label: "تماس", href: resolveContactHref("phone", store.phone) } : null,
    store.instagram
      ? { label: "اینستاگرام", href: resolveContactHref("instagram", store.instagram) }
      : null,
    store.telegram
      ? { label: "تلگرام", href: resolveContactHref("telegram", store.telegram) }
      : null,
    store.whatsapp
      ? { label: "واتساپ", href: resolveContactHref("whatsapp", store.whatsapp) }
      : null,
    ...(social_links || [])
      .filter((l) => l.is_active)
      .map((l) => ({ label: l.label, href: l.url })),
  ].filter(Boolean) as { label: string; href: string | null }[];

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{
        background: `linear-gradient(180deg, ${brand}22 0%, #f7f3ee 45%, #f7f3ee 100%)`,
      }}
    >
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="text-center">
          {store.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(store.logo_url)}
              alt=""
              className="mx-auto h-24 w-24 rounded-full object-cover shadow"
            />
          ) : (
            <div
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-2xl font-semibold text-white"
              style={{ background: brand }}
            >
              {store.name.slice(0, 1)}
            </div>
          )}
          <h1 className="mt-4 text-2xl font-semibold text-neutral-900">{store.name}</h1>
          {store.description ? (
            <p className="mt-2 text-sm text-neutral-600">{store.description}</p>
          ) : null}
        </div>

        <Link
          href={paths.store(slug)}
          className="block rounded-2xl py-3.5 text-center text-sm font-semibold text-white shadow"
          style={{ background: brand }}
        >
          سفارش از فروشگاه
        </Link>

        {topProducts.length ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-700">پرفروش‌ها</p>
            {topProducts.map((product) => (
              <Link
                key={product.id}
                href={paths.customer.storeProduct(slug, product.id)}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white/90 p-2.5"
              >
                {product.images?.[0]?.thumbnail_url || product.images?.[0]?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveMediaUrl(
                      product.images[0].thumbnail_url || product.images[0].image_url,
                    )}
                    alt=""
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-neutral-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{product.title}</p>
                  <p className="text-xs text-neutral-500">{formatMoney(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {contacts.length ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-700">ارتباط</p>
            {contacts.map((item) =>
              item.href ? (
                <a
                  key={item.label + item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl border border-neutral-200 bg-white/90 px-4 py-3 text-center text-sm font-medium text-neutral-800"
                >
                  {item.label}
                </a>
              ) : null,
            )}
          </div>
        ) : null}

        {store.hide_nisha_branding ? null : (
          <p className="pt-4 text-center text-xs text-neutral-400">میزبانی‌شده روی نیشا</p>
        )}
      </div>
    </div>
  );
}
