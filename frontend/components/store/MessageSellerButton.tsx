"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as conversationsApi from "@/lib/api/customer/conversations";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { paths } from "@/lib/auth/paths";
import { Button } from "@/components/ui/Button";

type MessageSellerButtonProps = {
  storeId: number;
};

export function MessageSellerButton({ storeId }: MessageSellerButtonProps) {
  const router = useRouter();
  const { customer } = useCustomerAuth();
  const [loading, setLoading] = useState(false);

  const loginHref = `${paths.customer.login}?redirect=${encodeURIComponent(
    `${paths.customer.conversations}?start_store=${storeId}`,
  )}`;

  async function handleClick() {
    if (!customer) return;
    setLoading(true);
    try {
      const conv = await conversationsApi.createConversation({ store_id: storeId });
      router.push(paths.customer.conversationDetail(conv.id));
    } catch {
      router.push(`${paths.customer.conversations}?start_store=${storeId}`);
    } finally {
      setLoading(false);
    }
  }

  if (!customer) {
    return (
      <Link href={loginHref}>
        <Button variant="secondary" size="sm">
          ورود برای چت
        </Button>
      </Link>
    );
  }

  return (
    <Button variant="secondary" size="sm" disabled={loading} onClick={() => void handleClick()}>
      <span className="sm:hidden">پیام</span>
      <span className="hidden sm:inline">ارسال پیام به فروشنده</span>
    </Button>
  );
}
