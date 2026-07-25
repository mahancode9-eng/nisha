import type { BillingPeriod, SubscriptionPlan } from "@/types/subscription";

/** Keep landing static prices in sync with backend PLAN_SEEDS. */
export const PLAN_CATALOG = [
  {
    code: "free",
    name_fa: "رایگان",
    monthly_price_toman: 0,
    quarterly_price_toman: 0,
    yearly_price_toman: 0,
    is_recommended: false,
    blurb: "شروع سریع با ویترین و فروش کارت‌به‌کارت",
    highlights: ["تا ۳۰ محصول", "آمار ۷ روزه", "بدون کارمزد روی فروش"],
  },
  {
    code: "basic",
    name_fa: "پایه",
    monthly_price_toman: 299_000,
    quarterly_price_toman: 807_000,
    yearly_price_toman: 2_990_000,
    is_recommended: false,
    blurb: "برای فروش جدی‌تر با خرید مهمان",
    highlights: ["خرید مهمان + کارت‌به‌کارت", "کد تخفیف", "تا ۲۰۰ محصول"],
  },
  {
    code: "pro",
    name_fa: "حرفه‌ای",
    monthly_price_toman: 599_000,
    quarterly_price_toman: 1_617_000,
    yearly_price_toman: 5_990_000,
    is_recommended: true,
    blurb: "پیشنهاد ما برای رشد پایدار",
    highlights: ["آمار ۹۰ روزه", "تم و صفحات فروشگاه", "خروجی Excel و ویدیو"],
  },
  {
    code: "enterprise",
    name_fa: "سازمانی",
    monthly_price_toman: 1_290_000,
    quarterly_price_toman: 3_483_000,
    yearly_price_toman: 12_900_000,
    is_recommended: false,
    blurb: "برای حجم بالا و پشتیبانی اولویت‌دار",
    highlights: ["همه قابلیت‌های حرفه‌ای", "پشتیبانی اولویت‌دار", "سقف محصول نامحدود"],
  },
] as const;

export type CatalogPlan = (typeof PLAN_CATALOG)[number];

export function priceForPeriod(
  plan: Pick<SubscriptionPlan, "monthly_price_toman" | "quarterly_price_toman" | "yearly_price_toman"> | CatalogPlan,
  period: BillingPeriod,
): number {
  if (period === "YEARLY") return plan.yearly_price_toman;
  if (period === "QUARTERLY") return plan.quarterly_price_toman;
  return plan.monthly_price_toman;
}

export function formatToman(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value) + " تومان";
}

export function periodLabel(period: BillingPeriod): string {
  if (period === "YEARLY") return "سالانه";
  if (period === "QUARTERLY") return "سه‌ماهه";
  return "ماهانه";
}

export function equivalentMonthly(total: number, period: BillingPeriod): number | null {
  if (total <= 0) return null;
  if (period === "YEARLY") return Math.round(total / 12);
  if (period === "QUARTERLY") return Math.round(total / 3);
  return total;
}

export function highlightsForPlan(plan: SubscriptionPlan | CatalogPlan): string[] {
  if ("highlights" in plan) return [...plan.highlights];
  const e = plan.entitlements;
  const items: string[] = [];
  if (e.max_products == null) items.push("محصول نامحدود");
  else items.push(`تا ${e.max_products} محصول`);
  items.push(`تا ${e.max_product_images} تصویر برای هر محصول`);
  if (e.discounts) items.push("کد تخفیف");
  if (e.guest_checkout) items.push("خرید مهمان");
  items.push(`آمار تا ${e.analytics_max_days} روز`);
  if (e.product_video) items.push("ویدیوی محصول");
  if (e.store_theme || e.store_pages) items.push("تم و صفحات فروشگاه");
  if (e.excel_export) items.push("خروجی Excel");
  if (e.priority_support) items.push("پشتیبانی اولویت‌دار");
  return items.slice(0, 6);
}
