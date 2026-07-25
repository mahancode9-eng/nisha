import type { Metadata } from "next";
import { ProductPageClient } from "./ProductPageClient";
import { sanitizeScriptContent } from "@/lib/sanitize";
import { getApiUrl, getSiteUrl } from "@/lib/env";

const SITE_URL = getSiteUrl();
const API_BASE = getApiUrl();

type PageProps = {
  params: Promise<{ slug: string; productId: string }>;
};

type ProductSeo = {
  title?: string;
  description?: string | null;
  price?: string | number | null;
  stock_quantity?: number | null;
  image_url?: string | null;
  average_rating?: string | number | null;
  review_count?: number | null;
};

type ProductSeoData = ProductSeo & {
  product?: ProductSeo | null;
};

async function fetchProductSeo(slug: string, productId: string): Promise<ProductSeo | null> {
  try {
    const res = await fetch(
      API_BASE + "/api/v1/public/stores/" + slug + "/products/" + productId,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as ProductSeoData;
    return data.product ?? data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, productId } = await params;
  const product = await fetchProductSeo(slug, productId);
  const title = product?.title ?? "محصول";
  const description = product?.description ?? "خرید آنلاین " + title + " در نیشا";
  const canonical = SITE_URL + "/store/" + slug + "/products/" + productId;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      ...(product?.image_url ? { images: [product.image_url] } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug, productId } = await params;
  const product = await fetchProductSeo(slug, productId);
  let jsonLdProps: { __html: string } | null = null;
  if (product?.title) {
    const reviewCount = Number(product.review_count ?? 0);
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      url: SITE_URL + "/store/" + slug + "/products/" + productId,
      ...(product.description ? { description: product.description } : {}),
      ...(product.image_url ? { image: product.image_url } : {}),
      ...(product.price != null
        ? {
            offers: {
              "@type": "Offer",
              price: String(product.price),
              priceCurrency: "IRR",
              availability:
                Number(product.stock_quantity ?? 1) > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
          }
        : {}),
      ...(reviewCount > 0 && product.average_rating != null
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: String(product.average_rating),
              reviewCount,
            },
          }
        : {}),
    });
    jsonLdProps = { __html: sanitizeScriptContent(jsonLd) };
  }
  return (
    <>
      {jsonLdProps && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps} />}
      <ProductPageClient slug={slug} productId={Number(productId)} />
    </>
  );
}
