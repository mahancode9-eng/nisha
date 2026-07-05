import { cn } from "@/lib/cn";
import { forwardRef, type TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, label, error, hint, id, ...props }, ref) {
    const inputId = id ?? props.name;
    const errorId = inputId ? `${inputId}-error` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "block w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand",
            error && "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400",
            className,
          )}
          {...props}
        />
        {error && <p id={errorId} className="text-sm text-red-600" role="alert">{error}</p>}
        {hint && !error && <p className="text-sm text-foreground-muted">{hint}</p>}
      </div>
    );
  },
);
