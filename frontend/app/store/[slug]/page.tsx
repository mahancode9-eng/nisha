import { StorePageClient } from "./StorePageClient";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;
  return <StorePageClient slug={slug} />;
}
