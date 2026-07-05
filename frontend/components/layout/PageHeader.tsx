import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageHeaderProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  size?: "page" | "section";
};

export function PageHeader({ title, description, action, size = "section" }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {title && (
          <h1
            className={cn(
              "font-bold text-foreground",
              size === "page" ? "text-2xl" : "text-xl",
            )}
          >
            {title}
          </h1>
        )}
        {description && (
          <p className={cn("text-foreground-muted", title ? "mt-1" : undefined)}>{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
