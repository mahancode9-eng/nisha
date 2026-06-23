import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/cn";

export type SocialPlatformKey =
  | "email"
  | "telegram"
  | "whatsapp"
  | "instagram"
  | "discord"
  | "x"
  | "website"
  | "other";

type SocialPlatformOption = {
  value: SocialPlatformKey;
  label: string;
};

export const SOCIAL_PLATFORM_OPTIONS: SocialPlatformOption[] = [
  { value: "email", label: "ایمیل" },
  { value: "telegram", label: "تلگرام" },
  { value: "whatsapp", label: "واتساپ" },
  { value: "instagram", label: "اینستاگرام" },
  { value: "discord", label: "دیسکورد" },
  { value: "x", label: "ایکس / توییتر" },
  { value: "website", label: "وب‌سایت" },
  { value: "other", label: "دیگر" },
];

export function getSocialPlatformLabel(platform: SocialPlatformKey): string {
  return SOCIAL_PLATFORM_OPTIONS.find((option) => option.value === platform)?.label ?? "دیگر";
}

function IconShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-foreground-muted",
        className,
      )}
      aria-hidden
    >
      {children}
    </span>
  );
}

function EmailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}

function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M21 4 3.5 11l4.8 1.4L10 20l3.1-3.4 4.9 3.7L21 4Z" />
      <path d="M8.3 12.4 18.7 6.4" />
    </svg>
  );
}

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 4a8 8 0 0 0-6.9 11.9L4 20l4.2-1A8 8 0 1 0 12 4Z" />
      <path d="M9.3 9.4c.2-.4.4-.5.7-.5h.7c.2 0 .4.1.5.3l.8 1.6c.1.2.1.4 0 .6l-.4.5a.4.4 0 0 0 0 .4c.5 1 1.4 1.8 2.4 2.4a.4.4 0 0 0 .4 0l.5-.4c.2-.1.4-.1.6 0l1.6.8c.2.1.3.3.3.5v.7c0 .3-.1.5-.5.7-.4.2-1 .3-1.8.1-1.7-.4-3.5-1.4-5-2.9S8.5 12.7 8 11c-.2-.8-.1-1.4.1-1.8Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DiscordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 18c1.2.8 2.5 1.2 5 1.2s3.8-.4 5-1.2c1.1-2 1.6-4.1 1.8-6.1-.9-1.5-2.1-2.7-3.6-3.5-.4.2-.8.5-1.2.8-.7-.2-1.3-.3-2-.3s-1.4.1-2 .3c-.4-.3-.8-.6-1.2-.8-1.5.8-2.7 2-3.6 3.5.2 2 .7 4.1 1.8 6.1Z" />
      <path d="M9.5 12.4h0M14.5 12.4h0" />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M5 5l14 14M18.5 5h-3.2L5 18.5H8.2L18.5 5Z" />
    </svg>
  );
}

function WebsiteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.1-3.5-8.5s1.2-6.2 3.5-8.5Z" />
    </svg>
  );
}

function OtherIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.3-1.3 1.1-1.3 2" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SocialIcon({ platform, className }: { platform: SocialPlatformKey; className?: string }) {
  const iconClass = cn("h-4 w-4", className);
  switch (platform) {
    case "email":
      return (
        <IconShell>
          <EmailIcon className={iconClass} />
        </IconShell>
      );
    case "telegram":
      return (
        <IconShell>
          <TelegramIcon className={iconClass} />
        </IconShell>
      );
    case "whatsapp":
      return (
        <IconShell>
          <WhatsAppIcon className={iconClass} />
        </IconShell>
      );
    case "instagram":
      return (
        <IconShell>
          <InstagramIcon className={iconClass} />
        </IconShell>
      );
    case "discord":
      return (
        <IconShell>
          <DiscordIcon className={iconClass} />
        </IconShell>
      );
    case "x":
      return (
        <IconShell>
          <XIcon className={iconClass} />
        </IconShell>
      );
    case "website":
      return (
        <IconShell>
          <WebsiteIcon className={iconClass} />
        </IconShell>
      );
    default:
      return (
        <IconShell>
          <OtherIcon className={iconClass} />
        </IconShell>
      );
  }
}

