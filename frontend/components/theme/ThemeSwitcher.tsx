"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useTheme } from "@/contexts/ThemeContext";
import type { ThemeMode } from "@/lib/theme";

type ThemeSwitcherProps = {
  variant?: "button" | "group";
  className?: string;
};

const themeModes: Array<{ value: ThemeMode; label: string }> = [
  { value: "light", label: "روشن" },
  { value: "dark", label: "تیره" },
  { value: "system", label: "سیستم" },
];

export function ThemeSwitcher({ variant = "button", className }: ThemeSwitcherProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === "button") {
    const nextLabel = resolvedTheme === "dark" ? "روشن" : "تیره";

    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className={className}
        aria-label={`تغییر به حالت ${nextLabel}`}
      >
        {nextLabel}
      </Button>
    );
  }

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {themeModes.map((mode) => {
        const active = theme === mode.value;

        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => setTheme(mode.value)}
            className={cn(
              "rounded-full px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand text-brand-foreground shadow-sm"
                : "bg-surface-muted text-foreground hover:bg-surface/80",
            )}
            aria-pressed={active}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
