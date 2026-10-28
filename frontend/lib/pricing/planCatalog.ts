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
    highlights: ["خرید مهمان بدون ثبت‌نام", "یک کد تخفیف فعال", "تا ۳۰ محصول"],
  },
  {
    code: "basic",
    name_fa: "پایه",
    monthly_price_toman: 299_000,
    quarterly_price_toman: 807_000,
    yearly_price_toman: 2_990_000,
    is_recommended: false,
    blurb: "وقتی سفارش‌ها بیشتر شد",
    highlights: ["تا ۲۰۰ محصول", "گزارش فروش و لیست مشتری", "خروجی Excel"],
  },
  {
    code: "pro",
    name_fa: "حرفه‌ای",
    monthly_price_toman: 599_000,
    quarterly_price_toman: 1_617_000,
    yearly_price_toman: 5_990_000,
    is_recommended: true,
    blurb: "برای فروشگاهی که داره بزرگ می‌شه",
    highlights: ["دامنه اختصاصی", "تیم تا ۳ نفر", "تم، صفحات و حذف نشان نیشا"],
  },
  {
    code: "enterprise",
    name_fa: "سازمانی",
    monthly_price_toman: 1_290_000,
    quarterly_price_toman: 3_483_000,
    yearly_price_toman: 12_900_000,
    is_recommended: false,
    blurb: "فروش زیاد، جواب سریع‌تر از پشتیبانی",
    highlights: ["همه امکانات پلن حرفه‌ای", "تیم نامحدود", "پشتیبانی اولویت‌دار"],
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

function entValue(e: unknown, key: string): unknown {
  return (e as Record<string, unknown>)[key];
}

export function highlightsForPlan(plan: SubscriptionPlan | CatalogPlan): string[] {
  if ("highlights" in plan) return [...plan.highlights];
  const e = plan.entitlements;
  const items: string[] = [];
  if (e.max_products == null) items.push("محصول نامحدود");
  else items.push(`تا ${e.max_products} محصول`);
  if (entValue(e, "custom_domain")) items.push("دامنه اختصاصی");
  if (entValue(e, "team_members")) {
    const max = entValue(e, "max_team_members");
    items.push(max == null ? "تیم نامحدود" : `تیم تا ${max} همکار`);
  }
  if (e.priority_support) items.push("پشتیبانی اولویت‌دار");
  if (e.remove_nisha_watermark) items.push("حذف نشان نیشا");
  if (e.discounts) {
    if (e.max_active_discount_codes == null) items.push("کد تخفیف نامحدود");
    else items.push(`${e.max_active_discount_codes} کد تخفیف فعال`);
  }
  if (e.sales_report) items.push("گزارش فروش ماهانه");
  if (e.customer_list) items.push("لیست مشتری‌ها");
  if (e.customer_tags) items.push("برچسب مشتری");
  if (e.excel_export) items.push("خروجی Excel");
  items.push(`تا ${e.max_product_images} عکس برای هر محصول`);
  if (e.messenger_receipt_actions) items.push("تایید رسید از تلگرام/بله");
  items.push(`آمار تا ${e.analytics_max_days} روز`);
  if (e.product_video) items.push("ویدیوی محصول");
  if (e.store_theme || e.store_pages) items.push("تم و صفحات فروشگاه");
  if (e.guest_checkout) items.push("خرید مهمان");
  return items.slice(0, 6);
}

export type PlanCode = "free" | "basic" | "pro" | "enterprise";
export type ComparisonValue = boolean | string;
export type ComparisonRow = {
  label: string;
  hint?: string;
  values: Record<PlanCode, ComparisonValue>;
};
export type ComparisonSection = { title: string; rows: ComparisonRow[] };

const row = (
  label: string,
  free: ComparisonValue,
  basic: ComparisonValue,
  pro: ComparisonValue,
  enterprise: ComparisonValue,
  hint?: string,
): ComparisonRow => ({ label, hint, values: { free, basic, pro, enterprise } });

/** Mirrors backend PLAN_SEEDS (entitlement_service.py). Keep in sync. */
export const PLAN_COMPARISON: ComparisonSection[] = [
  {
    title: "فروشگاه و محصول",
    rows: [
      row("تعداد محصول", "۳۰", "۲۰۰", "نامحدود", "نامحدود"),
      row("عکس برای هر محصول", "۳", "۸", "۸", "۸"),
      row("ویدیوی محصول", false, false, true, true),
      row("فیلدهای سفارشی محصول", false, true, true, true, "مثل سایز، رنگ یا هر ویژگی دلخواه"),
      row("ورود محصول از اینستاگرام", "۵ محصول", "نامحدود", "نامحدود", "نامحدود"),
      row("تم فروشگاه", false, false, true, true),
      row("صفحات فروشگاه", false, false, true, true, "مثل درباره ما و قوانین"),
      row("لینک کوتاه، QR و صفحه بیو", true, true, true, true),
      row("قالب‌های کارت اشتراک‌گذاری", false, true, true, true),
    ],
  },
  {
    title: "سفارش و پرداخت",
    rows: [
      row("بدون کارمزد روی فروش", true, true, true, true),
      row("پرداخت کارت‌به‌کارت", true, true, true, true),
      row("خرید مهمان بدون ثبت‌نام", true, true, true, true),
      row("صندوق سفارش‌ها", true, true, true, true),
      row("تایید رسید از تلگرام و بله", false, true, true, true),
      row("هشدار رسید تکراری", false, true, true, true),
      row("یادآوری قابل تنظیم رسید", false, true, true, true),
      row("روش‌های ارسال با نام", false, true, true, true),
      row("پیامک ماهانه", "—", "۵۰", "۳۰۰", "نامحدود"),
    ],
  },
  {
    title: "فروش و تخفیف",
    rows: [
      row("کد تخفیف فعال", "۱", "نامحدود", "نامحدود", "نامحدود"),
      row("تخفیف زمان‌دار", false, true, true, true),
    ],
  },
  {
    title: "گزارش و مشتری",
    rows: [
      row("بازه آمار فروشگاه", "۷ روز", "۳۰ روز", "۹۰ روز", "۹۰ روز"),
      row("گزارش فروش", false, true, true, true),
      row("خروجی Excel سفارش‌ها", false, true, true, true),
      row("لیست مشتری‌ها", false, true, true, true),
      row("برچسب مشتری", false, false, true, true),
      row("خروجی Excel مشتری‌ها", false, false, true, true),
    ],
  },
  {
    title: "برند و دامنه",
    rows: [
      row("حذف نشان نیشا", false, false, true, true),
      row("دامنه اختصاصی", false, false, true, true, "فروشگاه روی دامنه خودت"),
      row("نشان اعتماد", false, false, true, true),
      row("نشان ویژه", false, false, false, true),
    ],
  },
  {
    title: "تیم و پشتیبانی",
    rows: [
      row("حساب همکار", "—", "—", "۳ همکار", "نامحدود", "دسترسی جدا برای هر همکار"),
      row("پشتیبانی اولویت‌دار", false, false, false, true),
    ],
  },
];
