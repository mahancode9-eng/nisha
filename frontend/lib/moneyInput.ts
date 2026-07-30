/** Normalize Persian/Arabic digits and strip thousand separators for API/math. */
export function parseMoneyInput(value: string): string {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "");

  if (!normalized) return "";

  const [intPart = "", ...rest] = normalized.split(".");
  const decPart = rest.join("").slice(0, 2);
  return rest.length > 0 ? `${intPart}.${decPart}` : intPart;
}

/** Format a money string for typing: 1250000 → 1,250,000 */
export function formatMoneyInput(value: string): string {
  const raw = parseMoneyInput(value);
  if (!raw) return "";

  const [intPart, decPart] = raw.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}

export function moneyInputToNumber(value: string): number {
  return parseFloat(parseMoneyInput(value));
}
