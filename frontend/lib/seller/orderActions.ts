import type { OrderStatus } from "@/types/order";

export type OrderAction =
  | "confirm_payment"
  | "reject_payment"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancel";

const TERMINAL: OrderStatus[] = ["DELIVERED", "PAYMENT_REJECTED", "CANCELLED"];

const CONFIRM_SOURCES: OrderStatus[] = ["PENDING_PAYMENT", "PAYMENT_UPLOADED"];

const PATCH_FROM: Record<Exclude<OrderAction, "confirm_payment" | "reject_payment">, OrderStatus[]> = {
  preparing: ["PAYMENT_CONFIRMED"],
  shipped: ["PREPARING"],
  delivered: ["SHIPPED"],
  cancel: ["PAYMENT_CONFIRMED", "PREPARING", "SHIPPED"],
};

export function getAvailableOrderActions(status: OrderStatus): OrderAction[] {
  if (TERMINAL.includes(status)) return [];

  const actions: OrderAction[] = [];
  if (CONFIRM_SOURCES.includes(status)) {
    actions.push("confirm_payment", "reject_payment");
  }
  if (PATCH_FROM.preparing.includes(status)) actions.push("preparing");
  if (PATCH_FROM.shipped.includes(status)) actions.push("shipped");
  if (PATCH_FROM.delivered.includes(status)) actions.push("delivered");
  if (PATCH_FROM.cancel.includes(status)) actions.push("cancel");

  return actions;
}

export const ORDER_ACTION_LABELS: Record<OrderAction, string> = {
  confirm_payment: "تایید پرداخت",
  reject_payment: "رد پرداخت",
  preparing: "علامت‌گذاری به‌عنوان در حال آماده‌سازی",
  shipped: "علامت‌گذاری به‌عنوان ارسال‌شده",
  delivered: "علامت‌گذاری به‌عنوان تحویل‌شده",
  cancel: "لغو سفارش",
};

export function isDestructiveAction(action: OrderAction): boolean {
  return action === "reject_payment" || action === "cancel";
}

export function actionToPatchStatus(action: OrderAction): "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | null {
  const map: Partial<Record<OrderAction, "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED">> = {
    preparing: "PREPARING",
    shipped: "SHIPPED",
    delivered: "DELIVERED",
    cancel: "CANCELLED",
  };
  return map[action] ?? null;
}
