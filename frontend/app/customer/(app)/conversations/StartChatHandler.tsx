"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as conversationsApi from "@/lib/api/customer/conversations";
import { paths } from "@/lib/auth/paths";
import { LoadingState } from "@/components/ui/LoadingState";

export function StartChatHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeId = searchParams.get("start_store");

  useEffect(() => {
    if (!storeId) return;
    const id = parseInt(storeId, 10);
    if (Number.isNaN(id)) return;

    (async () => {
      try {
        const conv = await conversationsApi.createConversation({ store_id: id });
        router.replace(paths.customer.conversationDetail(conv.id));
      } catch {
        router.replace(paths.customer.conversations);
      }
    })();
  }, [storeId, router]);

  if (!storeId) return null;

  return <LoadingState message="Opening conversation…" />;
}
