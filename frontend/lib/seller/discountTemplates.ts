import type { DiscountType } from "@/types/seller/discount";

export type DiscountTemplate = {
  id: string;
  label: string;
  description: string;
  code: string;
  discount_type: DiscountType;
  percent_off?: string;
  amount_off?: string;
  min_order_amount?: string;
  max_uses?: string;
  /** Days from now; only applied when timed discounts are allowed. */
  expires_in_days?: number;
};

export const DISCOUNT_TEMPLATES: DiscountTemplate[] = [
  {
    id: "followers10",
    label: "۱۰٪ برای فالوورها",
    description: "کد استوری؛ مناسب معرفی فروشگاه",
    code: "FOLLOW10",
    discount_type: "PERCENT",
    percent_off: "10",
    expires_in_days: 7,
  },
  {
    id: "welcome50k",
    label: "۵۰ هزار خوش‌آمد",
    description: "مبلغ ثابت برای خرید اول",
    code: "WELCOME50",
    discount_type: "FIXED",
    amount_off: "50000",
    min_order_amount: "200000",
    max_uses: "100",
  },
  {
    id: "flash20",
    label: "۲۰٪ فلش",
    description: "تخفیف کوتاه‌مدت برای کمپین",
    code: "FLASH20",
    discount_type: "PERCENT",
    percent_off: "20",
    expires_in_days: 2,
    max_uses: "50",
  },
];

export function expiresAtFromDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
