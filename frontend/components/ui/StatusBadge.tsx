import type { OrderStatus } from "@/types/order";
import { Badge } from "@/components/ui/Badge";

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  PENDING_PAYMENT: { label: "در انتظار پرداخت", variant: "warning" },
  PAYMENT_UPLOADED: { label: "رسید پرداخت ثبت شد", variant: "info" },
  PAYMENT_CONFIRMED: { label: "پرداخت تایید شد", variant: "success" },
  PAYMENT_REJECTED: { label: "پرداخت رد شد", variant: "danger" },
  PREPARING: { label: "در حال آماده‌سازی", variant: "info" },
  SHIPPED: { label: "ارسال شد", variant: "info" },
  DELIVERED: { label: "تحویل شد", variant: "success" },
  CANCELLED: { label: "لغو شد", variant: "neutral" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
