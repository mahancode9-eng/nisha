import type { Metadata } from "next";
import { BioLinksClient } from "./BioLinksClient";
import { getApiUrl, getSiteUrl } from "@/lib/env";
import { resolveMediaUrl } from "@/lib/media";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function fetchStore(slug: string) {
  try {
    const res = await fetch(
      `${getApiUrl()}/api/v1/public/stores/${encodeURIComponent(slug)}`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchStore(slug);
  const name = data?.store?.name ?? slug;
  const title = `${name} · لینک‌ها`;
  const description = `سفارش و ارتباط با ${name} در نیشا`;
  const image = data?.store?.logo_url ? resolveMediaUrl(data.store.logo_url) : null;
  const canonical = `${getSiteUrl()}/store/${slug}/links`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function BioLinksPage({ params }: PageProps) {
  const { slug } = await params;
  return <BioLinksClient slug={slug} />;
}
