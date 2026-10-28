"use client";

import Link from "next/link";
import { paths } from "@/lib/auth/paths";
import { formatDateTime, formatMoney, toPersianDigits } from "@/lib/format";
import {
  getAvailableOrderActions,
  isDestructiveAction,
  ORDER_ACTION_LABELS,
  type OrderAction,
} from "@/lib/seller/orderActions";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { SellerOrderListItem } from "@/types/seller/order";

const SHORT_LABELS: Partial<Record<OrderAction, string>> = {
  confirm_payment: "تایید",
  reject_payment: "رد",
  preparing: "آماده‌سازی",
  shipped: "ارسال شد",
  delivered: "تحویل شد",
  cancel: "لغو",
};

type OrderInboxCardProps = {
  order: SellerOrderListItem;
  actionLoading?: boolean;
  chatLoading?: boolean;
  downloadLoading?: boolean;
  onAction: (action: OrderAction) => void;
  onChat: () => void;
  onDownload: () => void;
};

export function OrderInboxCard({
  order,
  actionLoading,
  chatLoading,
  downloadLoading,
  onAction,
  onChat,
  onDownload,
}: OrderInboxCardProps) {
  const actions = getAvailableOrderActions(order.status);

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={paths.seller.orderDetail(order.id)}
              className="font-semibold text-brand hover:underline"
            >
              {order.invoice_code}
            </Link>
            <StatusBadge status={order.status} />
            {(order.payment_proof_count ?? 0) > 0 ? (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                {toPersianDigits(order.payment_proof_count ?? 0)} رسید
              </span>
            ) : null}
          </div>
          <p className="text-sm text-foreground">
            {order.buyer_name}
            <span className="mx-1 text-foreground-muted">·</span>
            <span dir="ltr">{toPersianDigits(order.buyer_phone)}</span>
          </p>
          <p className="text-xs text-foreground-muted">{formatDateTime(order.created_at)}</p>
        </div>
        <p className="text-base font-semibold text-foreground">{formatMoney(order.total_amount)}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            size="sm"
            variant={
              isDestructiveAction(action)
                ? "danger"
                : action === "confirm_payment"
                  ? "primary"
                  : "secondary"
            }
            disabled={actionLoading}
            onClick={() => onAction(action)}
            title={ORDER_ACTION_LABELS[action]}
          >
            {SHORT_LABELS[action] ?? ORDER_ACTION_LABELS[action]}
          </Button>
        ))}
        <Button size="sm" variant="ghost" loading={chatLoading} onClick={onChat}>
          گفتگو
        </Button>
        <Button size="sm" variant="ghost" loading={downloadLoading} onClick={onDownload}>
          فاکتور
        </Button>
        <Link
          href={paths.seller.orderDetail(order.id)}
          className="inline-flex items-center rounded-lg px-2.5 text-sm text-foreground-muted hover:text-foreground"
        >
          جزئیات
        </Link>
      </div>
    </article>
  );
}
