import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, error, hint, id, children, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  const errorId = inputId ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "block w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
          error && "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p id={errorId} className="text-sm text-red-600" role="alert">{error}</p>}
      {hint && !error && <p className="text-sm text-foreground-muted">{hint}</p>}
    </div>
  );
});
