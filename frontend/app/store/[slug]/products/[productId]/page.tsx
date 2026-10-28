import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPageClient } from "./ProductPageClient";
import { sanitizeScriptContent } from "@/lib/sanitize";
import { getApiUrl, getSiteUrl } from "@/lib/env";
import { formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";

const SITE_URL = getSiteUrl();
const API_BASE = getApiUrl();

type PageProps = {
  params: Promise<{ slug: string; productId: string }>;
};

type ProductImageSeo = {
  image_url?: string | null;
  thumbnail_url?: string | null;
};

type ProductSeo = {
  title?: string;
  description?: string | null;
  price?: string | number | null;
  stock_quantity?: number | null;
  image_url?: string | null;
  images?: ProductImageSeo[] | null;
  average_rating?: string | number | null;
  review_count?: number | null;
};

type ProductSeoData = {
  product?: ProductSeo | null;
  store?: { name?: string | null } | null;
};

const PRODUCT_MISSING = "missing" as const;

function firstProductImage(product: ProductSeo | null | undefined): string | null {
  if (!product) return null;
  if (product.image_url) return resolveMediaUrl(product.image_url);
  const first = product.images?.[0];
  const raw = first?.thumbnail_url || first?.image_url;
  return raw ? resolveMediaUrl(raw) : null;
}

async function fetchProductSeo(
  slug: string,
  productId: string,
): Promise<(ProductSeo & { storeName?: string | null }) | typeof PRODUCT_MISSING | null> {
  try {
    const res = await fetch(
      API_BASE +
        "/api/v1/public/stores/" +
        encodeURIComponent(slug) +
        "/products/" +
        encodeURIComponent(productId),
      { next: { revalidate: 300 } },
    );
    if (res.status === 404) return PRODUCT_MISSING;
    if (!res.ok) return null;
    const data = (await res.json()) as ProductSeoData;
    const product = data.product ?? null;
    if (!product) return null;
    return { ...product, storeName: data.store?.name ?? null };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, productId } = await params;
  const result = await fetchProductSeo(slug, productId);
  const product = result === PRODUCT_MISSING ? null : result;
  const title = product?.title ?? "محصول";
  const storeName = product?.storeName;
  const priceLabel =
    product?.price != null && product.price !== ""
      ? formatMoney(product.price)
      : null;
  const shortDesc = (product?.description || "").trim().replace(/\s+/g, " ").slice(0, 120);
  const descriptionParts = [
    priceLabel,
    storeName ? `از ${storeName}` : null,
    shortDesc || `خرید آنلاین ${title} در نیشا`,
  ].filter(Boolean);
  const description = descriptionParts.join(" · ");
  const canonical = SITE_URL + "/store/" + slug + "/products/" + productId;
  const image = firstProductImage(product);
  const ogTitle = priceLabel ? `${title} — ${priceLabel}` : title;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      type: "website",
      siteName: storeName || "نیشا",
      locale: "fa_IR",
      ...(image
        ? {
            images: [
              {
                url: image,
                alt: title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: ogTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug, productId } = await params;
  const product = await fetchProductSeo(slug, productId);
  if (product === PRODUCT_MISSING) notFound();
  let jsonLdProps: { __html: string } | null = null;
  if (product?.title) {
    const reviewCount = Number(product.review_count ?? 0);
    const image = firstProductImage(product);
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      url: SITE_URL + "/store/" + slug + "/products/" + productId,
      ...(product.description ? { description: product.description } : {}),
      ...(image ? { image } : {}),
      ...(product.price != null
        ? {
            offers: {
              "@type": "Offer",
              // Prices are stored in toman; schema.org needs ISO 4217, and 1 toman = 10 IRR.
              price: String(Number(product.price) * 10),
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
