import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorePageClient } from "./StorePageClient";
import { VisitPing } from "./VisitPing";
import { sanitizeScriptContent } from "@/lib/sanitize";
import { getApiUrl, getSiteUrl } from "@/lib/env";
import { resolveMediaUrl } from "@/lib/media";

const SITE_URL = getSiteUrl();
const API_BASE = getApiUrl();

type PageProps = {
  params: Promise<{ slug: string }>;
};

type StoreSeoProfile = {
  name?: string;
  description?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
};

type StoreSeoData = {
  store?: StoreSeoProfile | null;
};

const STORE_MISSING = "missing" as const;

async function fetchStoreSeo(slug: string): Promise<StoreSeoProfile | typeof STORE_MISSING | null> {
  try {
    const res = await fetch(API_BASE + "/api/v1/public/stores/" + encodeURIComponent(slug), {
      next: { revalidate: 300 },
    });
    // Only a definite 404 means the store is gone; other failures fall back to client rendering.
    if (res.status === 404) return STORE_MISSING;
    if (!res.ok) return null;
    const data = (await res.json()) as StoreSeoData;
    return data.store ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchStoreSeo(slug);
  const store = result === STORE_MISSING ? null : result;
  const name = store?.name ?? slug;
  const description =
    store?.description ?? "خرید آنلاین از فروشگاه " + name + " در نیشا";
  const canonical = SITE_URL + "/store/" + slug;
  const imageRaw = store?.cover_image_url || store?.logo_url || null;
  const image = imageRaw ? resolveMediaUrl(imageRaw) : null;
  return {
    title: name,
    description,
    alternates: { canonical },
    openGraph: {
      title: name,
      description,
      url: canonical,
      type: "website",
      locale: "fa_IR",
      siteName: "نیشا",
      ...(image
        ? {
            images: [{ url: image, alt: name }],
          }
        : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: name,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;
  const store = await fetchStoreSeo(slug);
  if (store === STORE_MISSING) notFound();
  let jsonLdProps: { __html: string } | null = null;
  if (store?.name) {
    const imageRaw = store.cover_image_url || store.logo_url || null;
    const image = imageRaw ? resolveMediaUrl(imageRaw) : null;
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: store.name,
      url: SITE_URL + "/store/" + slug,
      ...(store.description ? { description: store.description } : {}),
      ...(image ? { image } : {}),
    });
    jsonLdProps = { __html: sanitizeScriptContent(jsonLd) };
  }

  return (
    <>
      {jsonLdProps ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps} />
      ) : null}
      <VisitPing slug={slug} />
      <StorePageClient slug={slug} />
    </>
  );
}
