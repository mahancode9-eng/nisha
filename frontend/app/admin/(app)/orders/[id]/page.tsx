"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import * as ordersApi from "@/lib/api/admin/orders";
import { paths } from "@/lib/auth/paths";
import { formatDateTime, formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import type { AdminOrderDetail, AdminOrderUpdateRequest } from "@/types/admin/order";
import type { OrderStatus } from "@/types/order";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAYMENT_UPLOADED: "رسید پرداخت ثبت شد",
  PAYMENT_CONFIRMED: "پرداخت تایید شد",
  PAYMENT_REJECTED: "پرداخت رد شد",
  PREPARING: "در حال آماده‌سازی",
  SHIPPED: "ارسال شد",
  DELIVERED: "تحویل شد",
  CANCELLED: "لغو شد",
};

const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  OPEN: "باز",
  IN_REVIEW: "در حال بررسی",
  RESOLVED: "حل‌شده",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

type OrderDraft = {
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string;
  buyer_note: string;
  status: OrderStatus;
  note: string;
};

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAYMENT_UPLOADED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_REJECTED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function defaultDraft(order: AdminOrderDetail): OrderDraft {
  return {
    buyer_name: order.buyer_name,
    buyer_phone: order.buyer_phone,
    buyer_address: order.buyer_address,
    buyer_note: order.buyer_note ?? "",
    status: order.status,
    note: "",
  };
}

export default function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const orderId = parseInt(id, 10);
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "submissions" | "chat" | "complaints" | "audit">("overview");
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, error, isLoading, refetch } = useSellerFetch(
    () => ordersApi.getOrder(orderId),
    [orderId],
  );

  useEffect(() => {
    if (data) {
      setDraft(defaultDraft(data));
    }
  }, [data]);

  const tabs = useMemo(
    () => [
      { id: "overview" as const, label: "نمای کلی" },
      { id: "submissions" as const, label: "ارسال‌ها" },
      { id: "chat" as const, label: `گفتگو${data?.conversation ? "" : " (بدون گفتگو)"}` },
      { id: "complaints" as const, label: `اعتراض‌ها (${data?.complaints.length ?? 0})` },
      { id: "audit" as const, label: `لاگ‌های نظارتی (${data?.audit_logs.length ?? 0})` },
    ],
    [data],
  );

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      const payload: AdminOrderUpdateRequest = {
        buyer_name: draft.buyer_name,
        buyer_phone: draft.buyer_phone,
        buyer_address: draft.buyer_address,
        buyer_note: draft.buyer_note,
        status: draft.status,
        note: draft.note || undefined,
      };
      await ordersApi.updateOrder(orderId, payload);
      toast.success("سفارش به‌روزرسانی شد");
      await refetch();
    } catch {
      toast.error("به‌روزرسانی سفارش ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <LoadingState message="در حال بارگذاری سفارش..." />;

  if (error || !data || !draft) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error ?? "سفارش پیدا نشد"} />
        <Link href={paths.admin.orders} className="text-sm text-brand hover:underline">
          بازگشت به سفارش‌ها
        </Link>
      </div>
    );
  }

  const conversation = data.conversation;

  return (
    <div className="page-stack">
      <div className="space-y-2">
        <Link href={paths.admin.orders} className="text-sm text-brand hover:underline">
          بازگشت به سفارش‌ها
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{data.invoice_code}</h1>
          <StatusBadge status={data.status} />
          {data.customer ? <Badge variant="info">مشتری ثبت‌نام‌شده</Badge> : <Badge>سفارش مهمان</Badge>}
        </div>
        <p className="text-sm text-foreground-muted">
          {data.store_name} ·{" "}
          <Link
            href={paths.store(data.store_slug)}
            className="text-brand hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            مشاهده فروشگاه
          </Link>{" "}
          · ثبت شده در {formatDateTime(data.created_at)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">مجموع</p>
            <p className="text-2xl font-bold text-foreground">{formatMoney(data.total_amount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">تعداد اعتراض</p>
            <p className="text-2xl font-bold text-foreground">{data.complaint_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">مشتری</p>
            <p className="font-semibold text-foreground">{data.customer?.full_name ?? "خریدار مهمان"}</p>
            <p className="text-sm text-foreground-muted">{data.customer?.email ?? data.buyer_phone}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">دسترسی فاکتور</p>
            <p className="font-mono text-sm font-semibold text-foreground">{data.invoice_username}</p>
            <p className="font-mono text-sm text-foreground-muted">{data.invoice_password ?? "برای سفارش قدیمی مخفی شده"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <CardTitle>مدیریت سفارش</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="نام خریدار"
                value={draft.buyer_name}
                onChange={(e) => setDraft((current) => current && { ...current, buyer_name: e.target.value })}
              />
              <Input
                label="تلفن خریدار"
                value={draft.buyer_phone}
                onChange={(e) => setDraft((current) => current && { ...current, buyer_phone: e.target.value })}
              />
            </div>
            <Textarea
              label="آدرس خریدار"
              rows={3}
              value={draft.buyer_address}
              onChange={(e) => setDraft((current) => current && { ...current, buyer_address: e.target.value })}
            />
            <Textarea
              label="یادداشت خریدار"
              rows={2}
              value={draft.buyer_note}
              onChange={(e) => setDraft((current) => current && { ...current, buyer_note: e.target.value })}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="block font-medium text-foreground">وضعیت</span>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft((current) =>
                      current ? { ...current, status: e.target.value as OrderStatus } : current,
                    )
                  }
                  className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <Textarea
                label="یادداشت ادمین"
                rows={3}
                value={draft.note}
                onChange={(e) => setDraft((current) => current && { ...current, note: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} loading={saving}>
                ذخیره تغییرات
              </Button>
              <Button
                variant="secondary"
                onClick={() => setDraft(defaultDraft(data))}
                disabled={saving}
              >
                بازنشانی
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="page-stack">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات مشتری</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="text-foreground-muted">نام کامل:</span> {data.customer?.full_name ?? "خریدار مهمان"}
              </p>
              <p>
                <span className="text-foreground-muted">ایمیل:</span> {data.customer?.email ?? "ثبت نشده"}
              </p>
              <p>
                <span className="text-foreground-muted">تلفن:</span> {data.customer?.phone ?? data.buyer_phone}
              </p>
              <p>
                <span className="text-foreground-muted">کد پستی:</span> {data.customer?.postal_code ?? "ثبت نشده"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>روش پرداخت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium text-foreground">{data.payment_method.display_name}</p>
              <Badge variant="info">{data.payment_method.type}</Badge>
              {data.payment_method.instructions && (
                <p className="text-foreground-muted">{data.payment_method.instructions}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-brand text-white"
                : "bg-surface text-foreground-muted hover:bg-surface-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>اقلام</CardTitle>
            </CardHeader>
            <CardContent>
              <Table embedded>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>محصول</TableHeaderCell>
                    <TableHeaderCell>تعداد</TableHeaderCell>
                    <TableHeaderCell>واحد</TableHeaderCell>
                    <TableHeaderCell>جمع</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_title_snapshot}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatMoney(item.unit_price_snapshot)}</TableCell>
                      <TableCell>{formatMoney(item.total_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-4 text-right font-semibold">جمع جزء: {formatMoney(data.subtotal_amount)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>تاریخچه وضعیت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {data.status_history.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {entry.old_status ? <StatusBadge status={entry.old_status} /> : <span className="text-sm text-foreground-muted">ایجاد شد</span>}
                    <span className="text-foreground-muted">→</span>
                    <StatusBadge status={entry.new_status} />
                  </div>
                  {entry.note && <p className="mt-1 text-foreground-muted">{entry.note}</p>}
                  <p className="mt-1 text-xs text-foreground-muted">{formatDateTime(entry.created_at)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "submissions" && (
        <Card>
          <CardHeader>
            <CardTitle>ارسال‌های فرم سفارشی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.submissions.length === 0 ? (
              <EmptyState
                title="ارسال سفارشی ندارد"
                description="این سفارش هیچ فیلد مخصوص محصولی نداشته است."
              />
            ) : (
              data.submissions.map((submission) => (
                <div key={submission.item_id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{submission.product_title_snapshot}</p>
                      <p className="text-sm text-foreground-muted">آیتم #{submission.item_id}</p>
                    </div>
                    <Badge variant="info">{submission.field_values.length} فیلد</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {submission.field_values.map((field) => (
                      <div key={`${submission.item_id}-${field.field_key}`} className="rounded-xl bg-surface-muted p-3">
                        <p className="font-medium text-foreground">{field.field_label}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">{field.field_type}</p>
                        {field.file_url ? (
                          <a
                            href={resolveMediaUrl(field.file_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm text-brand hover:underline"
                          >
                            باز کردن فایل
                          </a>
                        ) : (
                          <p className="mt-2 text-sm text-foreground">
                            {field.value_json !== null && field.value_json !== undefined
                              ? typeof field.value_json === "string"
                                ? field.value_json
                                : typeof field.value_json === "object"
                                  ? JSON.stringify(field.value_json)
                                  : String(field.value_json)
                              : field.value_text ?? "بدون مقدار"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "chat" && (
        <Card>
          <CardHeader>
            <CardTitle>گفتگوی سفارش</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!conversation ? (
              <EmptyState title="گفتگویی وجود ندارد" description="برای این سفارش هنوز اتاق گفتگویی ایجاد نشده است." />
            ) : (
              <div className="space-y-3">
                {conversation.messages.length === 0 ? (
                  <EmptyState title="هنوز پیامی نیست" description="گفتگو ایجاد شده اما خالی است." />
                ) : (
                  conversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-3xl rounded-2xl border p-4 ${
                        message.sender_type === "SELLER"
                          ? "border-brand/20 bg-brand/10"
                          : "border-border bg-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant={message.sender_type === "SELLER" ? "info" : "neutral"}>
                          {message.sender_type}
                        </Badge>
                        <span className="text-xs text-foreground-muted">{formatDateTime(message.created_at)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{message.body}</p>
                      {message.attachment_url && (
                        <a
                          href={resolveMediaUrl(message.attachment_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block overflow-hidden rounded-xl border border-border"
                        >
                          {message.attachment_mime_type?.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={resolveMediaUrl(message.attachment_url)}
                              alt=""
                              className="max-h-80 w-full object-cover"
                            />
                          ) : (
                            <div className="p-4 text-sm text-brand">باز کردن پیوست</div>
                          )}
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "complaints" && (
        <Card>
          <CardHeader>
            <CardTitle>اعتراض‌ها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.complaints.length === 0 ? (
              <EmptyState
                title="اعتراضی ثبت نشده"
                description="مشتریان برای این سفارش اعتراضی درباره عدم تحویل ثبت نکرده‌اند."
              />
            ) : (
              data.complaints.map((complaint) => (
                <div key={complaint.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{complaint.reason}</p>
                      <p className="text-xs text-foreground-muted">{formatDateTime(complaint.created_at)}</p>
                    </div>
                    <Badge>{COMPLAINT_STATUS_LABELS[complaint.status] ?? complaint.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-foreground">{complaint.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "audit" && (
        <Card>
          <CardHeader>
            <CardTitle>لاگ نظارتی ادمین</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.audit_logs.length === 0 ? (
              <EmptyState title="ورودی نظارتی ندارد" description="اقدام‌های ادمین اینجا نمایش داده می‌شوند." />
            ) : (
              data.audit_logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{log.action}</p>
                      <p className="text-xs text-foreground-muted">
                        {log.actor_name ?? "سیستم"} · {formatDateTime(log.created_at)}
                      </p>
                    </div>
                    <Badge variant="info">{log.entity_type}</Badge>
                  </div>
                  {log.note && <p className="mt-2 text-sm text-foreground">{log.note}</p>}
                  {Object.keys(log.details).length > 0 && (
                    <pre className="mt-3 overflow-x-auto rounded-xl bg-surface-muted p-3 text-xs text-foreground">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
