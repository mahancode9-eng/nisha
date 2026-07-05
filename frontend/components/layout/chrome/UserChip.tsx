import { cn } from "@/lib/cn";

type UserChipProps = {
  userName?: string | null;
  userMeta?: string | null;
  className?: string;
};

export function UserChip({ userName, userMeta, className }: UserChipProps) {
  if (!userName && !userMeta) return null;

  return (
    <div className={cn("min-w-0 rounded-2xl bg-surface-muted px-3 py-2", className)}>
      {userName && <p className="truncate text-sm font-medium text-foreground">{userName}</p>}
      {userMeta && <p className="truncate text-xs text-foreground-muted">{userMeta}</p>}
    </div>
  );
}
