"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { formatMoneyInput } from "@/lib/moneyInput";

type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode" | "onChange" | "value"> & {
  label?: string;
  error?: string;
  hint?: string;
  value: string;
  onValueChange: (formattedValue: string) => void;
  suffix?: string;
};

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { label, error, hint, id, name, className, value, onValueChange, suffix = "تومان", ...props },
  ref,
) {
  const inputId = id ?? name;
  const errorId = inputId ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-1.5 max-md:space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          {...props}
          ref={ref}
          id={inputId}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onValueChange(formatMoneyInput(e.target.value))}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "block w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand max-md:px-2.5 max-md:py-2",
            error &&
              "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400",
            className,
          )}
        />
        {suffix ? <span className="whitespace-nowrap text-sm text-foreground-muted">{suffix}</span> : null}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className="text-sm text-foreground-muted">{hint}</p>}
    </div>
  );
});
