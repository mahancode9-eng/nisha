import { cn } from "@/lib/cn";

type StatTileProps = {
  label: string;
  value: string | number;
  className?: string;
};

export function StatTile({ label, value, className }: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-5 shadow-sm",
        className,
      )}
    >
      <p className="text-sm text-foreground-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
