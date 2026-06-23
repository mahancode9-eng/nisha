"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/lib/auth/paths";
import { LoadingState } from "@/components/ui/LoadingState";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(paths.admin.login);
      return;
    }
    if (user.role !== "ADMIN") {
      router.replace(user.role === "SELLER" ? paths.seller.dashboard : paths.admin.login);
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "ADMIN") {
    return <LoadingState message="در حال بارگذاری پنل مدیریت..." />;
  }

  return <>{children}</>;
}
