import { cn } from "@/lib/cn";

export type LandingButtonVariant = "primary" | "secondary" | "ghost";
export type LandingButtonSize = "sm" | "md" | "lg";

type LandingButtonClassesProps = {
  variant?: LandingButtonVariant;
  size?: LandingButtonSize;
  className?: string;
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const variantClasses: Record<LandingButtonVariant, string> = {
  primary: "bg-brand text-brand-foreground shadow-sm hover:bg-brand/90 focus-visible:ring-brand",
  secondary: "border border-border bg-surface text-foreground shadow-sm hover:bg-surface-muted focus-visible:ring-brand/40",
  ghost: "text-foreground hover:bg-surface-muted focus-visible:ring-brand/40",
};

const sizeClasses: Record<LandingButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-sm",
};

export function landingButtonClasses({
  variant = "primary",
  size = "md",
  className,
}: LandingButtonClassesProps = {}): string {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
}
