import type { MetadataRoute } from "next";
import { getApiUrl, getSiteUrl } from "@/lib/env";

const SITE_URL = getSiteUrl();
const API_BASE = getApiUrl();

type SitemapPayload = {
  stores?: Array<{ slug: string }>;
  products?: Array<{ store_slug: string; product_id: number }>;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
  ];
  try {
    const res = await fetch(API_BASE + "/api/v1/public/sitemap", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return entries;
    const data = (await res.json()) as SitemapPayload;
    for (const store of data.stores ?? []) {
      entries.push({
        url: SITE_URL + "/store/" + store.slug,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
    for (const product of data.products ?? []) {
      entries.push({
        url: SITE_URL + "/store/" + product.store_slug + "/products/" + String(product.product_id),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    // API unavailable (e.g. during build) — fall back to the homepage only.
  }
  return entries;
}
