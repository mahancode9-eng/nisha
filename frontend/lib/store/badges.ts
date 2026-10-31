/** Persian labels for store trust badges shown on the storefront. */

const BADGE_LABELS: Record<string, string> = {
  VERIFIED: "تأییدشده نیشا",
  TRUSTED: "فروشگاه قابل‌اعتماد",
  PREMIUM: "نشان ویژه",
};

export function trustBadgeLabel(badge: string): string {
  return BADGE_LABELS[badge] ?? badge;
}
