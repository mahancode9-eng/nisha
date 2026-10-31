import { paths } from "@/lib/auth/paths";
import { ApiError } from "@/lib/api/errors";

export type SuggestedPlan = "basic" | "pro" | "enterprise";

const PLAN_LABEL: Record<SuggestedPlan, string> = {
  basic: "پایه",
  pro: "حرفه‌ای",
  enterprise: "سازمانی",
};

/** Entitlement key → lowest plan that usually unlocks it (for upgrade copy). */
const FEATURE_PLAN: Record<string, SuggestedPlan> = {
  discounts: "basic",
  timed_discounts: "basic",
  excel_export: "basic",
  guest_checkout: "basic",
  custom_fields: "basic",
  messenger_receipt_actions: "basic",
  named_shipping_methods: "basic",
  share_card_templates: "basic",
  duplicate_receipt_warn: "basic",
  product_video: "pro",
  store_theme: "pro",
  store_pages: "pro",
  badge_trust: "pro",
  sales_report: "basic",
  customer_tags: "pro",
  configurable_receipt_reminder: "basic",
  badge_premium: "enterprise",
  priority_support: "enterprise",
  store_team: "enterprise",
  custom_domain: "enterprise",
  remove_nisha_watermark: "pro",
};

const FEATURE_TITLE: Record<string, string> = {
  discounts: "کد تخفیف",
  timed_discounts: "تخفیف زمان‌دار",
  excel_export: "خروجی Excel",
  guest_checkout: "خرید مهمان",
  custom_fields: "فیلد سفارشی",
  product_video: "ویدیوی محصول",
  store_theme: "تم فروشگاه",
  store_pages: "صفحه‌های فروشگاه",
  badge_trust: "نشان اعتماد",
  badge_premium: "نشان ویژه",
  sales_report: "گزارش فروش",
  customer_tags: "برچسب مشتری",
  named_shipping_methods: "روش ارسال نام‌دار",
  store_team: "همکار فروشگاه",
  custom_domain: "دامنه اختصاصی",
  remove_nisha_watermark: "حذف برند نیشا",
};

export function planLabel(plan: SuggestedPlan): string {
  return PLAN_LABEL[plan];
}

export function suggestedPlanFor(entitlement: string | undefined | null): SuggestedPlan {
  if (!entitlement) return "basic";
  return FEATURE_PLAN[entitlement] ?? "basic";
}

export function featureTitle(entitlement: string | undefined | null): string | null {
  if (!entitlement) return null;
  return FEATURE_TITLE[entitlement] ?? null;
}

export function subscriptionUpgradeHref(feature?: string | null): string {
  const base = paths.seller.subscription;
  if (!feature) return base;
  return `${base}?feature=${encodeURIComponent(feature)}`;
}

export function upgradeGateCopy(entitlement: string | undefined | null): {
  title: string;
  description: string;
  suggestedPlan: SuggestedPlan;
  href: string;
} {
  const suggestedPlan = suggestedPlanFor(entitlement);
  const title = featureTitle(entitlement);
  const plan = planLabel(suggestedPlan);
  return {
    title: title ? `${title} تو پلن فعلی نیست` : "این امکان تو پلن بالاتر فعاله",
    description: `از پلن ${plan} به بالا می‌تونی ازش استفاده کنی. پلن رو ارتقا بده.`,
    suggestedPlan,
    href: subscriptionUpgradeHref(entitlement),
  };
}

type ToastLike = {
  error: (message: string, action?: { label: string; href: string }) => void;
};

/** Toast an API failure; entitlement blocks get a direct link to plans. */
export function toastApiFailure(
  toast: ToastLike,
  err: unknown,
  fallback: string,
): void {
  if (err instanceof ApiError && err.upgradeRequired) {
    const feature =
      typeof err.meta?.entitlement === "string" ? err.meta.entitlement : null;
    toast.error(err.message, {
      label: "دیدن پلن‌ها",
      href: subscriptionUpgradeHref(feature),
    });
    return;
  }
  toast.error(err instanceof ApiError ? err.message : fallback);
}
