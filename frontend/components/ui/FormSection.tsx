import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function FormSection({ title, description, action, children }: FormSectionProps) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] text-foreground-muted">{title}</p>
          {description && <p className="mt-1 text-sm text-foreground-muted">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  );
}
