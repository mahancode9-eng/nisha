import type { Metadata } from "next";
import { StorePageClient } from "./StorePageClient";
import { VisitPing } from "./VisitPing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const API_BASE =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type StoreSeoProfile = {
  name?: string;
  description?: string | null;
  logo_url?: string | null;
};

type StoreSeoData = {
  store?: StoreSeoProfile | null;
};

async function fetchStoreSeo(slug: string): Promise<StoreSeoProfile | null> {
  try {
    const res = await fetch(API_BASE + "/api/v1/public/stores/" + slug, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as StoreSeoData;
    return data.store ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await fetchStoreSeo(slug);
  const name = store?.name ?? slug;
  const description =
    store?.description ?? "خرید آنلاین از فروشگاه " + name + " در نیشا";
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
    jsonLdProps = { __html: jsonLd };
  }
  return (
    <>
      {jsonLdProps && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps} />}
      <VisitPing slug={slug} />
      <StorePageClient slug={slug} />
    </>
  );
}
