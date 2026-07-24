import { cn } from "@/lib/cn";
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

type TableProps = HTMLAttributes<HTMLTableElement> & {
  /** Use inside Card — no outer border, aligns with card edges */
  embedded?: boolean;
};

export function Table({ className, embedded, ...props }: TableProps) {
  if (embedded) {
    return (
      <div className="-mx-5 overflow-x-auto max-md:shadow-[inset_-8px_0_8px_-8px_rgba(0,0,0,0.08)] sm:-mx-6">
        <table className={cn("min-w-full divide-y divide-border", className)} {...props} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-surface shadow-sm max-md:shadow-[inset_-8px_0_8px_-8px_rgba(0,0,0,0.08)]">
      <table className={cn("min-w-full divide-y divide-border", className)} {...props} />
    </div>
  );
}

export function TableHead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="bg-surface-muted/80" {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-border bg-surface" {...props} />;
}

export function TableRow(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className="transition-colors hover:bg-surface-muted" {...props} />;
}

export function TableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-start text-xs font-medium uppercase tracking-wide text-foreground-muted max-md:px-3 max-md:py-2 sm:px-5",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "whitespace-nowrap px-4 py-3 text-sm text-foreground max-md:px-3 max-md:py-2 sm:px-5",
        className,
      )}
      {...props}
    />
  );
}
