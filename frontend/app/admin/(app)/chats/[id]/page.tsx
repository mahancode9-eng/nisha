"use client";

import { use, useCallback } from "react";
import Link from "next/link";
import * as chatsApi from "@/lib/api/admin/chats";
import { paths } from "@/lib/auth/paths";
import { ChatThread } from "@/components/chat/ChatThread";
import { useChatPolling } from "@/hooks/useChatPolling";
import { useToast } from "@/contexts/ToastContext";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminChatDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const conversationId = Number(id);
  const toast = useToast();

  const fetchConversation = useCallback(
    () => chatsApi.getChat(conversationId),
    [conversationId],
  );

  const { data, error, isLoading } = useChatPolling({
    fetchFn: fetchConversation,
    intervalMs: 5000,
  });

  return (
    <div className="space-y-4">
      <Link href={paths.admin.chats} className="text-sm text-brand hover:underline">
        بازگشت به گفتگوها
      </Link>
      <ChatThread
        conversation={data}
        isLoading={isLoading}
        error={error}
        ownSenderType="SELLER"
        showComposer={false}
        onSend={async () => {
          toast.error("نمای گفتگوی ادمین فقط خواندنی است");
        }}
        header={
          data ? (
            <div>
              <h1 className="font-semibold text-foreground">{data.store_name}</h1>
              <p className="text-xs text-foreground-muted">{data.customer_name}</p>
              {data.invoice_code && <p className="text-xs text-foreground-muted">سفارش {data.invoice_code}</p>}
            </div>
          ) : (
            <span className="text-neutral-500">در حال بارگذاری...</span>
          )
        }
      />
    </div>
  );
}
