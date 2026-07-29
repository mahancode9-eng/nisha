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

export function socialInputPlaceholder(platform: SocialPlatformKey): string {
  switch (platform) {
    case "telegram":
      return "@username یا https://t.me/...";
    case "instagram":
    case "x":
      return "@handle یا لینک پروفایل";
    case "whatsapp":
      return "شماره یا لینک wa.me";
    case "website":
      return "https://example.com";
    case "email":
      return "name@email.com";
    case "discord":
    case "other":
    default:
      return "لینک یا شناسه";
  }
}

export function socialInputHint(platform: SocialPlatformKey): string | undefined {
  switch (platform) {
    case "email":
      return undefined;
    case "website":
      return "با یا بدون https مجاز است";
    case "telegram":
    case "instagram":
    case "x":
    case "whatsapp":
    case "discord":
    case "other":
    default:
      return "هر سه شکل مجاز: @، لینک، یا شناسه ساده";
  }
}

function stripAt(handle: string): string {
  return handle.replace(/^@+/, "").trim();
}

/** Normalize stored contact values into openable hrefs for storefront display. */
export function resolveContactHref(platform: SocialPlatformKey, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (platform === "email") {
    return trimmed.startsWith("mailto:") ? trimmed : `mailto:${trimmed}`;
  }

  if (platform === "website" && !/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  if (trimmed.startsWith("@")) {
    const handle = stripAt(trimmed);
    if (!handle) return trimmed;
    if (platform === "telegram") return `https://t.me/${handle}`;
    if (platform === "instagram") return `https://instagram.com/${handle}`;
    if (platform === "x") return `https://x.com/${handle}`;
  }

  return trimmed;
}
