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
    blurb: "فروشگاهت رو بساز و با کارت‌به‌کارت بفروش",
    highlights: ["خرید مهمان", "یک کد تخفیف فعال", "تا ۳۰ محصول"],
  },
  {
    code: "basic",
    name_fa: "پایه",
    monthly_price_toman: 299_000,
    quarterly_price_toman: 807_000,
    yearly_price_toman: 2_990_000,
    is_recommended: false,
    blurb: "وقتی سفارش‌ها بیشتر شد",
    highlights: ["کد تخفیف نامحدود", "تایید رسید از تلگرام", "تا ۲۰۰ محصول"],
  },
  {
    code: "pro",
    name_fa: "حرفه‌ای",
    monthly_price_toman: 599_000,
    quarterly_price_toman: 1_617_000,
    yearly_price_toman: 5_990_000,
    is_recommended: true,
    blurb: "برای فروشگاهی که داره بزرگ می‌شه",
    highlights: ["آمار ۹۰ روزه", "تم و صفحات فروشگاه", "ویدیوی محصول"],
  },
  {
    code: "enterprise",
    name_fa: "سازمانی",
    monthly_price_toman: 1_290_000,
    quarterly_price_toman: 3_483_000,
    yearly_price_toman: 12_900_000,
    is_recommended: false,
    blurb: "فروش زیاد، جواب سریع‌تر از پشتیبانی",
    highlights: ["همه امکانات پلن حرفه‌ای", "پشتیبانی اولویت‌دار", "تعداد محصول نامحدود"],
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
  items.push(`تا ${e.max_product_images} عکس برای هر محصول`);
  if (e.discounts) {
    if (e.max_active_discount_codes == null) items.push("کد تخفیف نامحدود");
    else items.push(`${e.max_active_discount_codes} کد تخفیف فعال`);
  }
  if (e.guest_checkout) items.push("خرید مهمان");
  if (e.excel_export) items.push("خروجی Excel");
  if (e.messenger_receipt_actions) items.push("تایید رسید از تلگرام/بله");
  items.push(`آمار تا ${e.analytics_max_days} روز`);
  if (e.product_video) items.push("ویدیوی محصول");
  if (e.store_theme || e.store_pages) items.push("تم و صفحات فروشگاه");
  if (e.priority_support) items.push("پشتیبانی اولویت‌دار");
  return items.slice(0, 6);
}
