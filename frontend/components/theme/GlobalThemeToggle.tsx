"use client";

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

export function GlobalThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nextLabel = isDark ? "روشن" : "تیره";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`تغییر به حالت ${nextLabel}`}
      title={`حالت ${nextLabel}`}
      className="fixed bottom-4 start-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-md transition hover:bg-surface-muted print:hidden"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
