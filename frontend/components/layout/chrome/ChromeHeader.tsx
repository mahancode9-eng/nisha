"use client";

import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
import { ChromeMenuToggle } from "./ChromeMobileDrawer";
import { cn } from "@/lib/cn";

type ChromeHeaderProps = {
  title?: string;
  subtitle?: string;
  brand?: ReactNode;
  showBrandMark?: boolean;
  showBrandTagline?: boolean;
  actions?: ReactNode;
  mobileActions?: ReactNode;
  secondaryNav?: ReactNode;
  className?: string;
  innerClassName?: string;
  menuOpen: boolean;
  onMenuToggle: () => void;
};

export function ChromeHeader({
  title,
  subtitle,
  brand,
  showBrandMark = false,
  showBrandTagline = false,
  actions,
  mobileActions,
  secondaryNav,
  className,
  innerClassName,
  menuOpen,
  onMenuToggle,
}: ChromeHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:py-4",
          innerClassName,
        )}
      >
        <div className="min-w-0 flex-1">
          {brand ?? (showBrandMark ? <BrandMark showTagline={showBrandTagline} /> : null)}
          {title && (
            <h1 className="truncate text-base font-semibold text-foreground lg:text-lg">{title}</h1>
          )}
          {subtitle && <p className="hidden text-sm text-foreground-muted sm:block">{subtitle}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {mobileActions}
          {actions && <div className="hidden items-center gap-2 md:flex">{actions}</div>}
          <ChromeMenuToggle open={menuOpen} onToggle={onMenuToggle} />
        </div>
      </div>

      {secondaryNav}
    </header>
  );
}
