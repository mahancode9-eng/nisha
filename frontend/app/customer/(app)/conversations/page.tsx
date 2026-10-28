"use client";

import { Suspense, useCallback } from "react";
import { StartChatHandler } from "./StartChatHandler";
import * as conversationsApi from "@/lib/api/customer/conversations";
import { paths } from "@/lib/auth/paths";
import { ConversationListItemRow } from "@/components/chat/ConversationListItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { useChatPolling } from "@/hooks/useChatPolling";

export default function CustomerConversationsPage() {
  const fetchList = useCallback(() => conversationsApi.listConversations(), []);
  const { data, error, isLoading } = useChatPolling({
    fetchFn: fetchList,
    intervalMs: 10000,
  });

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <StartChatHandler />
      </Suspense>
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">گفتگوهات</h1>
        <p className="mt-1 text-sm text-neutral-600">پیام‌هات با فروشنده‌ها، درباره سفارش یا هر سؤال دیگه.</p>
      </div>

      {isLoading && !data && <TableSkeleton rows={4} columns={1} />}

      <ErrorAlert message={error ?? ""} />

      {data && data.length === 0 && (
        <EmptyState
          title="هنوز گفتگویی نداری"
          description="از صفحه هر فروشگاه می‌تونی به فروشنده پیام بدی."
        />
      )}

      {data && data.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {data.map((item) => (
            <ConversationListItemRow
              key={item.id}
              item={item}
              href={paths.customer.conversationDetail(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
