"use client";

import Link from "next/link";
import { useCallback } from "react";
import * as chatsApi from "@/lib/api/admin/chats";
import { paths } from "@/lib/auth/paths";
import { formatDateTime } from "@/lib/format";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function AdminChatsPage() {
  const fetchChats = useCallback(() => chatsApi.listChats(), []);
  const { data, error, isLoading } = useSellerFetch(fetchChats, []);

  return (
    <div className="space-y-6">
      <PageHeader description="نمایش فقط‌خواندنی همه گفتگوهای سفارش و قدیمی" />

      {isLoading && <TableSkeleton rows={5} columns={1} />}
      <ErrorAlert message={!isLoading && error ? error : ""} />

      {!isLoading && data?.length === 0 && (
        <EmptyState title="گفتگویی وجود ندارد" description="وقتی خریداران با فروشندگان تماس بگیرند، گفتگوها اینجا نمایش داده می‌شوند." />
      )}

      {data && data.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {data.map((item) => (
            <Link
              key={item.id}
              href={paths.admin.chatDetail(item.id)}
              className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 hover:bg-surface-muted"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.store_name}</p>
                <p className="text-sm text-foreground-muted">{item.customer_name}</p>
                {item.invoice_code && <p className="text-xs text-foreground-muted">سفارش {item.invoice_code}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.unread_count > 0 && <Badge variant="info">{item.unread_count} خوانده‌نشده</Badge>}
                <span className="text-xs text-foreground-muted">
                  {formatDateTime(item.last_message_at ?? item.updated_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
