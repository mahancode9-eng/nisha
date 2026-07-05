"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useBodyScrollLock } from "./useBodyScrollLock";

type ChromeMobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  animate?: boolean;
};

export function ChromeMobileDrawer({
  open,
  onClose,
  children,
  className,
  animate = false,
}: ChromeMobileDrawerProps) {
  useBodyScrollLock(open);

  if (animate) {
    return (
      <div
        className={cn(
          "overflow-hidden border-t border-border/70 bg-background/90 transition-all duration-300 md:hidden",
          open ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className={cn("mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6", className)}>
          {children}
        </div>
      </div>
    );
  }

  if (!open) return null;

  return (
    <div className="border-t border-border bg-surface md:hidden">
      <div className={cn("mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6", className)}>
        {children}
      </div>
    </div>
  );
}

export function ChromeMenuToggle({
  open,
  onToggle,
  className,
}: {
  open: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-muted md:hidden",
        className,
      )}
      aria-label="منو"
      aria-expanded={open}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        {open ? (
          <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
        ) : (
          <>
            <path d="M4 7h16" strokeLinecap="round" />
            <path d="M4 12h16" strokeLinecap="round" />
            <path d="M4 17h16" strokeLinecap="round" />
          </>
        )}
      </svg>
    </button>
  );
}
