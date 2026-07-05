import { ProductPageClient } from "./ProductPageClient";

type PageProps = {
  params: Promise<{ slug: string; productId: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { slug, productId } = await params;
  return <ProductPageClient slug={slug} productId={Number(productId)} />;
}
