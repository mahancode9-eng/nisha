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
  discounts: true,
  max_active_discount_codes: 1,
  timed_discounts: false,
  analytics_max_days: 7,
  guest_checkout: true,
  messenger_receipt_actions: false,
  badge_trust: false,
  badge_premium: false,
  store_theme: false,
  excel_export: false,
  store_pages: false,
  priority_support: false,
  sales_report: false,
  customer_list: false,
  customer_tags: false,
  customer_export: false,
  remove_nisha_watermark: false,
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
