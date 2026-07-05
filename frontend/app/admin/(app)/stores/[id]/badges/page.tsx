"use client";

import { use, useCallback, useMemo, useState } from "react";
import * as storesApi from "@/lib/api/admin/stores";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { formatDateTime } from "@/lib/format";
import type { AdminStoreBadge, AdminStoreBadgeHistoryItem } from "@/types/admin/moderation";
import type { StoreBadgeType } from "@/types/store";

type PageProps = {
  params: Promise<{ id: string }>;
};

type StoreBadgePageData = {
  badges: AdminStoreBadge[];
  history: AdminStoreBadgeHistoryItem[];
};

const BADGE_TYPES: StoreBadgeType[] = ["VERIFIED", "TRUSTED", "PREMIUM"];

export default function StoreBadgesPage({ params }: PageProps) {
  const { id } = use(params);
  const storeId = Number(id);
  const [action, setAction] = useState<StoreBadgeType | null>(null);

  const fetchData = useCallback(async (): Promise<StoreBadgePageData> => {
    const [badges, history] = await Promise.all([
      storesApi.listStoreBadges(storeId),
      storesApi.listStoreBadgeHistory(storeId),
    ]);
    return { badges, history };
  }, [storeId]);

  const { data, error, isLoading, refetch } = useSellerFetch(fetchData, [storeId]);

  const activeBadges = useMemo(() => data?.badges.filter((badge) => badge.is_active) ?? [], [data]);
  const badgeMap = useMemo(
    () => new Map(activeBadges.map((badge) => [badge.badge_type, badge])),
    [activeBadges],
  );

  async function toggleBadge(badgeType: StoreBadgeType) {
    setAction(badgeType);
    try {
      if (badgeMap.has(badgeType)) {
        await storesApi.removeStoreBadge(storeId, badgeType);
      } else {
        await storesApi.assignStoreBadge(storeId, badgeType);
      }
      await refetch();
    } catch {
      // Shared error banner will show the latest fetch error if refetch fails.
    } finally {
      setAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">نشان‌های فروشگاه</h1>
        <p className="mt-1 text-foreground-muted">نشان‌های اعتماد فروشگاه #{storeId} را مدیریت کنید.</p>
      </div>

      {isLoading && <TableSkeleton rows={4} columns={3} />}
      <ErrorAlert message={!isLoading && error ? error : ""} />

      {!isLoading && data && (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            {BADGE_TYPES.map((badgeType) => {
              const isActive = badgeMap.has(badgeType);
              return (
                <div key={badgeType} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={isActive ? "success" : "neutral"}>{badgeType}</Badge>
                    <span className="text-xs text-foreground-muted">{isActive ? "فعال" : "غیرفعال"}</span>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    variant={isActive ? "secondary" : "primary"}
                    loading={action === badgeType}
                    onClick={() => void toggleBadge(badgeType)}
                  >
                    {isActive ? "حذف" : "اختصاص"}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-lg font-semibold text-foreground">تاریخچه</h2>
            {data.history.length === 0 ? (
              <EmptyState title="تاریخی وجود ندارد" description="تخصیص نشان‌ها اینجا نمایش داده می‌شود." />
            ) : (
              <Table className="mt-4">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>نشان</TableHeaderCell>
                    <TableHeaderCell>اقدام</TableHeaderCell>
                    <TableHeaderCell>یادداشت</TableHeaderCell>
                    <TableHeaderCell>زمان</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="info">{item.badge_type}</Badge>
                      </TableCell>
                      <TableCell>{item.action}</TableCell>
                      <TableCell>{item.note ?? "—"}</TableCell>
                      <TableCell>{formatDateTime(item.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
