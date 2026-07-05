import { StoreLayoutWrapper } from "./StoreLayoutWrapper";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function StoreLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  return <StoreLayoutWrapper slug={slug}>{children}</StoreLayoutWrapper>;
}
