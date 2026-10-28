"use client";

import {
  getSocialPlatformLabel,
  SocialIcon,
  type SocialPlatformKey,
} from "@/components/ui/SocialIcon";
import { normalizeSocialPlatform, resolveContactHref } from "@/lib/seller/contactChannels";
import type { PublicStoreProfile, PublicStoreSocialLink } from "@/types/public/store";

type StoreContactCardProps = {
  store: PublicStoreProfile;
  className?: string;
};

type ContactItem = {
  key: string;
  label: string;
  href: string;
  platform: SocialPlatformKey;
};

function legacyContacts(store: PublicStoreProfile): ContactItem[] {
  const items: ContactItem[] = [];
  if (store.phone?.trim()) {
    const phone = store.phone.trim();
    items.push({
      key: "phone",
      label: "تلفن",
      href: phone.startsWith("tel:") ? phone : `tel:${phone}`,
      platform: "other",
    });
  }
  if (store.support_contact?.trim()) {
    const value = store.support_contact.trim();
    const looksEmail = value.includes("@");
    items.push({
      key: "support",
      label: "پشتیبانی",
      href: looksEmail
        ? resolveContactHref("email", value)
        : value.startsWith("http")
          ? value
          : `tel:${value}`,
      platform: looksEmail ? "email" : "other",
    });
  }
  const legacy: Array<[keyof PublicStoreProfile, SocialPlatformKey, string]> = [
    ["telegram", "telegram", "تلگرام"],
    ["whatsapp", "whatsapp", "واتساپ"],
    ["instagram", "instagram", "اینستاگرام"],
    ["bale", "other", "بله"],
    ["website", "website", "وب‌سایت"],
  ];
  for (const [field, platform, label] of legacy) {
    const raw = store[field];
    if (typeof raw !== "string" || !raw.trim()) continue;
    items.push({
      key: field,
      label,
      href: resolveContactHref(platform, raw),
      platform,
    });
  }
  return items;
}

function socialContacts(links: PublicStoreSocialLink[] | undefined): ContactItem[] {
  return (links ?? [])
    .filter((link) => link.is_active && link.url.trim())
    .map((link) => {
      const platform = normalizeSocialPlatform(link.icon_key, link.label);
      return {
        key: `social-${link.id}`,
        label: link.icon_key ? getSocialPlatformLabel(platform) : link.label,
        href: resolveContactHref(platform, link.url),
        platform,
      };
    });
}

export function StoreContactCard({ store, className }: StoreContactCardProps) {
  const contacts = [...legacyContacts(store), ...socialContacts(store.social_links)];
  const seen = new Set<string>();
  const unique = contacts.filter((item) => {
    const fingerprint = `${item.platform}:${item.href}`;
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });

  return (
    <div className={className ?? "space-y-3 text-sm"}>
      <p className="font-medium text-foreground">{store.name}</p>
      {unique.length === 0 ? (
        <p className="text-foreground-muted">فروشنده هنوز راه ارتباطی نذاشته.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {unique.map((item) => (
            <li key={item.key}>
              <a
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm transition hover:border-brand/40 hover:text-brand"
              >
                <SocialIcon platform={item.platform} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
