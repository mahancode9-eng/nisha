import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorePageClient } from "./StorePageClient";
import { VisitPing } from "./VisitPing";
import { sanitizeScriptContent } from "@/lib/sanitize";
import { getApiUrl, getSiteUrl } from "@/lib/env";

const SITE_URL = getSiteUrl();
const API_BASE = getApiUrl();

type PageProps = {
  params: Promise<{ slug: string }>;
};

type StoreSeoProfile = {
  name?: string;
  description?: string | null;
  logo_url?: string | null;
  hide_nisha_branding?: boolean;
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
    store?.description ??
    "خرید آنلاین از فروشگاه " + name + (store?.hide_nisha_branding ? "" : " در نیشا");
  const canonical = SITE_URL + "/store/" + slug;
  return {
    title: name,
    description,
    alternates: { canonical },
    openGraph: {
      title: name,
      description,
      url: canonical,
      type: "website",
      ...(store?.logo_url ? { images: [store.logo_url] } : {}),
    },
    twitter: {
      card: "summary",
      title: name,
      description,
    },
  };
}

export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;
  const store = await fetchStoreSeo(slug);
  if (store === STORE_MISSING) notFound();
  let jsonLdProps: { __html: string } | null = null;
  if (store?.name) {
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: store.name,
      url: SITE_URL + "/store/" + slug,
      ...(store.description ? { description: store.description } : {}),
      ...(store.logo_url ? { image: store.logo_url } : {}),
    });
    jsonLdProps = { __html: sanitizeScriptContent(jsonLd) };
  }
  return (
    <>
      {jsonLdProps && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps} />}
      <VisitPing slug={slug} />
      <StorePageClient slug={slug} />
    </>
  );
}
