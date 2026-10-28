"use client";

import { cn } from "@/lib/cn";
import { useTheme } from "@/contexts/ThemeContext";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden>
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5Z" />
    </svg>
  );
}

type ThemeModeToggleProps = {
  className?: string;
};

/** Compact light/dark control for headers and menus — not a floating FAB. */
export function ThemeModeToggle({ className }: ThemeModeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nextLabel = isDark ? "روشن" : "تیره";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`تغییر به حالت ${nextLabel}`}
      title={`حالت ${nextLabel}`}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-surface/80 text-foreground transition hover:bg-surface-muted print:hidden",
        className,
      )}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/** @deprecated Use ThemeModeToggle in chrome instead of a global float. */
export function GlobalThemeToggle() {
  return <ThemeModeToggle />;
}
