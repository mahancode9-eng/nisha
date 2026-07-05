import { getSocialPlatformLabel, type SocialPlatformKey } from "@/components/ui/SocialIcon";

export function normalizeSocialPlatform(iconKey: string | null | undefined, label: string): SocialPlatformKey {
  const normalized = (iconKey ?? label).toLowerCase();
  if (normalized.includes("email") || normalized.includes("mail")) return "email";
  if (normalized.includes("telegram")) return "telegram";
  if (normalized.includes("whatsapp")) return "whatsapp";
  if (normalized.includes("instagram")) return "instagram";
  if (normalized.includes("discord")) return "discord";
  if (normalized.includes("twitter") || normalized.includes("x")) return "x";
  if (normalized.includes("web")) return "website";
  return "other";
}

export function makeSocialLinkLabel(platform: SocialPlatformKey, customLabel: string): string {
  return platform === "other" ? customLabel.trim() || "دیگر" : getSocialPlatformLabel(platform);
}

export function resolveContactHref(platform: SocialPlatformKey, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (platform === "email") {
    return trimmed.startsWith("mailto:") ? trimmed : `mailto:${trimmed}`;
  }
  if (platform === "website" && !/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

