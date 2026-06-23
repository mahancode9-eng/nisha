import { PublicRouteFrame } from "@/components/layout/PublicRouteFrame";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicRouteFrame>{children}</PublicRouteFrame>;
}
