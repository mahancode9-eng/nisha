"use client";

import Link from "next/link";
import { use, useCallback } from "react";
import * as conversationsApi from "@/lib/api/seller/conversations";
import { paths } from "@/lib/auth/paths";
import { ChatThread } from "@/components/chat/ChatThread";
import { useChatPolling } from "@/hooks/useChatPolling";
import { useToast } from "@/contexts/ToastContext";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function SellerConversationPage({ params }: PageProps) {
  const { id } = use(params);
  const conversationId = parseInt(id, 10);
  const toast = useToast();

  const fetchConversation = useCallback(
    () => conversationsApi.getConversation(conversationId),
    [conversationId],
  );

  const { data, error, isLoading, refetch } = useChatPolling({
    fetchFn: fetchConversation,
    intervalMs: 4000,
  });

  return (
    <div className="page-stack">
      <Link href={paths.seller.conversations} className="text-sm text-brand hover:underline">
        بازگشت به پیام‌ها
      </Link>
      <ChatThread
        conversation={data}
        isLoading={isLoading}
        error={error}
        ownSenderType="SELLER"
        onSend={async (payload) => {
          try {
            await conversationsApi.sendMessage(conversationId, payload);
            await refetch();
          } catch {
            toast.error("ارسال پیام ناموفق بود");
          }
        }}
        header={
          data ? (
            <div>
              <h1 className="font-semibold text-neutral-900">{data.customer_name}</h1>
              {data.invoice_code && <p className="text-xs text-neutral-500">سفارش {data.invoice_code}</p>}
            </div>
          ) : (
            <span className="text-neutral-500">در حال بارگذاری...</span>
          )
        }
      />
    </div>
  );
}
