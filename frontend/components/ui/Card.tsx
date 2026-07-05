import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-surface shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-b border-border px-5 pt-5 pb-4 sm:px-6", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-semibold text-foreground", className)} {...props}>
      {children}
    </h2>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-sm text-foreground-muted", className)} {...props}>
      {children}
    </p>
  );
}

type CardContentProps = {
  className?: string;
  children: ReactNode;
  /** default: standard padding; flush: no padding (full-bleed images, etc.) */
  padding?: "default" | "flush";
};

export function CardContent({
  className,
  children,
  padding = "default",
}: CardContentProps) {
  return (
    <div
      className={cn(
        padding === "default" && "px-5 py-5 sm:px-6",
        padding === "flush" && "p-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
