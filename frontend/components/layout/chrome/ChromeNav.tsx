"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type ChromeNavItem = {
  href: string;
  label: string;
  description?: string;
};

type ChromeNavProps = {
  items: ChromeNavItem[];
  variant: "pills" | "sidebar";
  onNavigate?: () => void;
  className?: string;
  scrollable?: boolean;
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ChromeNav({
  items,
  variant,
  onNavigate,
  className,
  scrollable = false,
}: ChromeNavProps) {
  const pathname = usePathname();

  if (variant === "pills") {
    return (
      <nav
        className={cn(
          "flex gap-2",
          scrollable ? "overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "flex-wrap",
          className,
        )}
      >
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors",
                active
                  ? "bg-brand text-brand-foreground"
                  : "bg-surface text-foreground-muted hover:bg-surface-muted",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={cn("space-y-1", className)}>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "block rounded-2xl px-4 py-3 text-sm transition-colors",
              active
                ? "bg-brand-soft text-brand-deep"
                : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            <span className="block font-medium">{item.label}</span>
            {item.description && (
              <span className="mt-1 block text-xs text-foreground-muted">{item.description}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
