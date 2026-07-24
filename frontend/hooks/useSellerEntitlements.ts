"use client";

import { useMemo } from "react";
import * as subscriptionApi from "@/lib/api/seller/subscription";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import type { PlanEntitlements, SellerSubscriptionDetail, SubscriptionPlan } from "@/types/subscription";

const DEFAULT_ENTITLEMENTS: PlanEntitlements = {
  max_products: 30,
  max_product_images: 3,
  product_video: false,
  custom_fields: false,
  discounts: false,
  analytics_max_days: 7,
  guest_checkout: false,
  badge_trust: false,
  badge_premium: false,
  store_theme: false,
  excel_export: false,
  store_pages: false,
  priority_support: false,
};

export function useSellerEntitlements() {
  const { data, error, isLoading, refetch } = useSellerFetch(
    () => subscriptionApi.getSubscription(),
    [],
  );

  const entitlements = useMemo<PlanEntitlements>(() => {
    if (!data?.entitlements) return DEFAULT_ENTITLEMENTS;
    return { ...DEFAULT_ENTITLEMENTS, ...data.entitlements };
  }, [data]);

  const plan: SubscriptionPlan | null = data?.effective_plan ?? null;
  const detail: SellerSubscriptionDetail | null = data;

  return {
    entitlements,
    plan,
    detail,
    error,
    isLoading,
    refetch,
  };
}
