"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/lib/auth/paths";
import { LoadingState } from "@/components/ui/LoadingState";

export function SellerAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(paths.seller.login);
      return;
    }
    if (user.role !== "SELLER") {
      router.replace(user.role === "ADMIN" ? paths.admin.dashboard : paths.seller.login);
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "SELLER") {
    return <LoadingState message="در حال بارگذاری پنل فروشنده..." />;
  }

  return <>{children}</>;
}
