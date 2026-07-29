import type { MetadataRoute } from "next";
import { getApiUrl, getSiteUrl } from "@/lib/env";
import { paths } from "@/lib/auth/paths";

const SITE_URL = getSiteUrl();
const API_BASE = getApiUrl();

type SitemapPayload = {
  stores?: Array<{ slug: string }>;
  products?: Array<{ store_slug: string; product_id: number }>;
};

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: SITE_URL, changeFrequency: "daily", priority: 1 },
  { url: SITE_URL + paths.pricing, changeFrequency: "weekly", priority: 0.9 },
  { url: SITE_URL + paths.about, changeFrequency: "monthly", priority: 0.9 },
  { url: SITE_URL + paths.trackOrder, changeFrequency: "monthly", priority: 0.5 },
  { url: SITE_URL + paths.terms, changeFrequency: "yearly", priority: 0.5 },
  { url: SITE_URL + paths.privacy, changeFrequency: "yearly", priority: 0.5 },
  { url: SITE_URL + paths.complaintsPolicy, changeFrequency: "yearly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [...STATIC_PAGES];
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
    // API unavailable (e.g. during build) — fall back to static public pages.
  }
  return entries;
}
