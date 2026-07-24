"use client";

import { cn } from "@/lib/cn";
import type { BillingPeriod } from "@/types/subscription";

const OPTIONS: { value: BillingPeriod; label: string; hint?: string }[] = [
  { value: "MONTHLY", label: "ماهانه" },
  { value: "QUARTERLY", label: "سه‌ماهه", hint: "≈۱۰٪ کمتر" },
  { value: "YEARLY", label: "سالانه", hint: "۲ ماه هدیه" },
];

type PricingPeriodToggleProps = {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  className?: string;
};

export function PricingPeriodToggle({ value, onChange, className }: PricingPeriodToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center justify-center gap-1 rounded-full border border-border bg-surface-muted/60 p-1",
        className,
      )}
      role="group"
      aria-label="دوره پرداخت"
    >
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              selected
                ? "bg-foreground text-background shadow-sm"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            <span>{option.label}</span>
            {option.hint && selected && (
              <span className="mr-1.5 text-xs opacity-80">({option.hint})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
