"use client";

import * as conversationsApi from "@/lib/api/seller/conversations";
import { paths } from "@/lib/auth/paths";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConversationListItemRow } from "@/components/chat/ConversationListItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function SellerConversationsPage() {
  const { data, error, isLoading, refetch } = useSellerFetch(
    () => conversationsApi.listConversations(),
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader description="با مشتریان خود گفتگو کنید" />

      {isLoading && <TableSkeleton rows={5} columns={1} />}

      <ErrorAlert message={error ?? ""} />

      {!isLoading && data?.length === 0 && (
        <EmptyState
          title="هنوز پیامی ندارید"
          description="وقتی مشتریان به فروشگاه شما پیام دهند، گفتگوها اینجا نمایش داده می‌شوند."
        />
      )}

      {data && data.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {data.map((item) => (
            <ConversationListItemRow
              key={item.id}
              item={item}
              href={paths.seller.conversationDetail(item.id)}
              subtitle={item.customer_name}
            />
          ))}
        </div>
      )}

      <button type="button" className="sr-only" onClick={() => void refetch()}>
        تازه‌سازی
      </button>
    </div>
  );
}
