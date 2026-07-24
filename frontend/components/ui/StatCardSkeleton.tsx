import { Skeleton } from "@/components/ui/Skeleton";

type StatCardSkeletonProps = {
  count?: number;
};

export function StatCardSkeleton({ count = 4 }: StatCardSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm max-md:p-3"
        >
          <Skeleton className="mb-3 h-3 w-24 max-md:mb-1" />
          <Skeleton className="h-8 w-16 max-md:h-6" />
        </div>
      ))}
    </div>
  );
}
