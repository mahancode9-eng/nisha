function getLocale(): string {
  return "fa-IR";
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Convert Latin digits in a string to Persian digits. */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => FA_DIGITS[Number(digit)] ?? digit);
}

/** Locale number with Persian digits (counts, quantities, rates). */
export function formatNumber(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return toPersianDigits(String(value));
  return toPersianDigits(new Intl.NumberFormat(getLocale()).format(num));
}

/** Group card digits as XXXX XXXX XXXX XXXX (Latin grouping; pair with toPersianDigits for display). */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatMoney(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return toPersianDigits(String(value));
  const formatted = new Intl.NumberFormat(getLocale(), {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
  return `${toPersianDigits(formatted)} تومان`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return toPersianDigits(iso);
  return toPersianDigits(
    d.toLocaleString(getLocale(), {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  );
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return toPersianDigits(iso);
  return toPersianDigits(d.toLocaleDateString(getLocale(), { dateStyle: "medium" }));
}

export function paymentMethodTypeLabel(type: string): string {
  if (type === "CARD_TO_CARD") return "کارت‌به‌کارت";
  if (type === "CRYPTO") return "رمزارز";
  if (type === "EXTERNAL_GATEWAY") return "درگاه پرداخت";
  return type;
}

const COMPLAINT_REASON_LABELS: Record<string, string> = {
  NON_DELIVERY: "سفارش نرسید",
  DAMAGED: "آسیب‌دیده",
  WRONG_ITEM: "کالای اشتباه",
  OTHER: "سایر",
};

export function complaintReasonLabel(reason: string): string {
  return COMPLAINT_REASON_LABELS[reason] ?? reason;
}

/** Customer's delivery confirmation on an order (not the payment receipt). */
export function deliveryReceiptLabel(status: string | null | undefined): string {
  if (status === "RECEIVED") return "تحویل گرفته";
  if (status === "NOT_RECEIVED") return "تحویل نگرفته";
  return "ثبت نشده";
}
