"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { paths } from "@/lib/auth/paths";
import { LoadingState } from "@/components/ui/LoadingState";
import type { UserRole } from "@/types/auth";

type GuestOnlyProps = {
  children: React.ReactNode;
  role: UserRole;
};

export function GuestOnly({ children, role }: GuestOnlyProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user?.role === role) {
      const dest =
        role === "SELLER" ? paths.seller.dashboard : paths.admin.dashboard;
      router.replace(dest);
    }
  }, [user, isLoading, role, router]);

  if (isLoading) {
    return <LoadingState message="داریم نشست رو چک می‌کنیم…" />;
  }

  if (user?.role === role) {
    return <LoadingState message="داریم می‌ریم پنل…" />;
  }

  return <>{children}</>;
}
