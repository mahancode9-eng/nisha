"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as conversationsApi from "@/lib/api/customer/conversations";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { paths } from "@/lib/auth/paths";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type MessageSellerButtonProps = {
  storeId: number;
  /** Compact circular icon for store header; default is text button. */
  variant?: "button" | "icon";
  className?: string;
};

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5.5 18.5 4 21l3.2-1.2A8.5 8.5 0 1 0 5.5 18.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.5 11h7M8.5 14h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function MessageSellerButton({
  storeId,
  variant = "button",
  className,
}: MessageSellerButtonProps) {
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

  if (variant === "icon") {
    const iconClass = cn(
      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground shadow-sm transition sm:h-10 sm:w-10",
      "hover:border-brand/40 hover:bg-surface-muted hover:text-brand",
      "disabled:cursor-not-allowed disabled:opacity-60",
      className,
    );

    if (!customer) {
      return (
        <Link
          href={loginHref}
          className={iconClass}
          aria-label="ورود برای گفتگو با فروشنده"
          title="گفتگو"
        >
          <ChatIcon className="h-5 w-5" />
        </Link>
      );
    }

    return (
      <button
        type="button"
        className={iconClass}
        disabled={loading}
        onClick={() => void handleClick()}
        aria-label={loading ? "داره گفتگو رو باز می‌کنه…" : "گفتگو با فروشنده"}
        title="گفتگو"
      >
        <ChatIcon className="h-5 w-5" />
      </button>
    );
  }

  if (!customer) {
    return (
      <Link href={loginHref} className={className}>
        <Button variant="secondary" size="sm" className="rounded-xl">
          ورود برای گفتگو
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className={cn("rounded-xl", className)}
      disabled={loading}
      onClick={() => void handleClick()}
    >
      <span className="sm:hidden">پیام</span>
      <span className="hidden sm:inline">ارسال پیام به فروشنده</span>
    </Button>
  );
}
