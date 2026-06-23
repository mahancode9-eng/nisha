"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { paths } from "@/lib/auth/paths";
import { LoadingState } from "@/components/ui/LoadingState";

export function CustomerAuthGuard({ children }: { children: React.ReactNode }) {
  const { customer, isLoading } = useCustomerAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!customer) {
      router.replace(paths.customer.login);
    }
  }, [customer, isLoading, router]);

  if (isLoading || !customer) {
    return <LoadingState message="در حال بارگذاری پنل مشتری..." />;
  }

  return <>{children}</>;
}
