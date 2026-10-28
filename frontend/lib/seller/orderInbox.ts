import type { OrderStatus } from "@/types/order";

export type InboxStage = "proof" | "prep" | "ship" | "done" | "cancelled";

export type InboxStageMeta = {
  key: InboxStage;
  label: string;
  statuses: OrderStatus[];
  emptyTitle: string;
  emptyDescription: string;
};

export const INBOX_STAGES: InboxStageMeta[] = [
  {
    key: "proof",
    label: "رسید پرداخت",
    statuses: ["PENDING_PAYMENT", "PAYMENT_UPLOADED", "PAYMENT_REJECTED"],
    emptyTitle: "رسیدی برای بررسی نیست",
    emptyDescription: "وقتی خریدار رسید بفرسته، اینجا می‌بینی.",
  },
  {
    key: "prep",
    label: "آماده‌سازی",
    statuses: ["PAYMENT_CONFIRMED", "PREPARING"],
    emptyTitle: "سفارشی برای آماده‌سازی نیست",
    emptyDescription: "بعد از تایید پرداخت، سفارش‌ها اینجا میان.",
  },
  {
    key: "ship",
    label: "ارسال",
    statuses: ["SHIPPED"],
    emptyTitle: "سفارش در راهی نیست",
    emptyDescription: "وقتی ارسال کردی، اینجا می‌مونه تا تحویل ثبت بشه.",
  },
  {
    key: "done",
    label: "تحویل‌شده",
    statuses: ["DELIVERED"],
    emptyTitle: "هنوز تحویلی ثبت نشده",
    emptyDescription: "سفارش‌های تحویل‌شده اینجا جمع می‌شن.",
  },
  {
    key: "cancelled",
    label: "لغو‌شده",
    statuses: ["CANCELLED"],
    emptyTitle: "سفارش لغو‌شده‌ای نیست",
    emptyDescription: "اگر سفارشی لغو بشه، اینجا می‌بینی.",
  },
];
