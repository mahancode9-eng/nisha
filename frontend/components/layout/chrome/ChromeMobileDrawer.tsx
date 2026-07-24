"use client";

import Link from "next/link";
import { useEffect, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useBodyScrollLock } from "./useBodyScrollLock";

type ChromeMobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function ChromeMobileDrawer({
  open,
  onClose,
  children,
  className,
}: ChromeMobileDrawerProps) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div className="md:hidden" aria-hidden={!open}>
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-label="بستن منو"
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed top-0 end-0 z-50 flex h-full w-[min(100%,20rem)] flex-col border-s border-border bg-surface shadow-xl transition-transform duration-200",
          open ? "translate-x-0" : "pointer-events-none ltr:translate-x-full rtl:-translate-x-full",
        )}
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
      >
        <div className={cn("flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4", className)}>
          {children}
        </div>
      </aside>
    </div>
  );
}

type MobileNavLinkProps = ComponentProps<typeof Link> & {
  onClose: () => void;
};

/** Nav link that closes the mobile drawer on click. */
export function MobileNavLink({ onClose, onClick, ...props }: MobileNavLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClose();
        onClick?.(event);
      }}
    />
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
        "inline-flex h-10 w-10 max-md:h-9 max-md:w-9 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-muted md:hidden",
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
