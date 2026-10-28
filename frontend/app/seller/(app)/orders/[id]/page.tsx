"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import * as ordersApi from "@/lib/api/seller/orders";
import { paths } from "@/lib/auth/paths";
import { deliveryReceiptLabel, formatDateTime, paymentMethodTypeLabel } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import {
  actionToPatchStatus,
  isDestructiveAction,
  ORDER_ACTION_LABELS,
  type OrderAction,
} from "@/lib/seller/orderActions";
import { ApiError } from "@/lib/api/errors";
import { downloadOrderInvoice } from "@/lib/orders/downloadInvoice";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { OrderActions } from "@/components/seller/OrderActions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OrderItemsPanel } from "@/components/orders/OrderItemsPanel";
import type { OrderStatus } from "@/types/order";

type PageProps = {
  params: Promise<{ id: string }>;
};

const TRACKING_STATUSES: OrderStatus[] = [
  "PAYMENT_CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
];

export default function SellerOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const orderId = parseInt(id, 10);
  const toast = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<OrderAction | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);

  const { data, error, isLoading, refetch } = useSellerFetch(
    () => ordersApi.getOrder(orderId),
    [orderId],
  );

  useEffect(() => {
    setTrackingCode(data?.tracking_code ?? "");
  }, [data?.tracking_code]);

  async function executeAction(action: OrderAction) {
    setActionLoading(true);
    try {
      if (action === "confirm_payment") {
        await ordersApi.confirmPayment(orderId);
        toast.success("پرداخت تایید شد");
      } else if (action === "reject_payment") {
        await ordersApi.rejectPayment(orderId);
        toast.success("پرداخت رد شد");
      } else {
        const status = actionToPatchStatus(action);
        if (!status) return;
        await ordersApi.patchOrderStatus(orderId, { status });
        toast.success(ORDER_ACTION_LABELS[action]);
      }
      await refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "وضعیت سفارش تغییر نکرد. دوباره امتحان کن.");
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  }

  function handleAction(action: OrderAction) {
    if (action === "confirm_payment" || isDestructiveAction(action)) {
      setPendingAction(action);
      return;
    }
    void executeAction(action);
  }

  async function handleDownload() {
    if (!data) return;
    setDownloadLoading(true);
    try {
      await downloadOrderInvoice(() => ordersApi.downloadInvoice(orderId), data.invoice_code);
      toast.success("فاکتور دانلود شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "فاکتور دانلود نشد. دوباره امتحان کن.");
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleTrackingSave(e: FormEvent) {
    e.preventDefault();
    const cleaned = trackingCode.trim();
    if (!cleaned) {
      toast.error("کد پیگیری رو وارد کن.");
      return;
    }
    setTrackingLoading(true);
    try {
      await ordersApi.updateTrackingCode(orderId, cleaned);
      toast.success("کد پیگیری ذخیره شد");
      await refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "کد پیگیری ذخیره نشد. دوباره امتحان کن.");
    } finally {
      setTrackingLoading(false);
    }
  }

  if (isLoading) return <LoadingState message="داره سفارش رو بارگذاری می‌کنه…" />;
  if (error || !data) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error ?? "سفارش پیدا نشد"}
        </p>
        <Link href={paths.seller.orders} className="text-sm text-brand hover:underline">
          برگرد به سفارش‌ها
        </Link>
      </div>
    );
  }

  const confirmTitle =
    pendingAction === "confirm_payment"
      ? "تایید پرداخت"
      : pendingAction === "reject_payment"
        ? "رد پرداخت"
        : "لغو سفارش";
  const confirmMessage =
    pendingAction === "confirm_payment"
      ? "مطمئنی پرداخت این سفارش تایید بشه؟"
      : pendingAction === "reject_payment"
        ? "به مشتری خبر می‌دیم که دوباره پرداخت کنه و موجودی کالا برمی‌گرده."
        : "سفارش لغو می‌شه و موجودی کالاها به انبار برمی‌گرده.";
  const canEditTracking = TRACKING_STATUSES.includes(data.status);

  return (
    <div className="page-stack">
      <div>
        <Link href={paths.seller.orders} className="text-sm text-brand hover:underline">
          ← برگرد به سفارش‌ها
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-neutral-900">{data.invoice_code}</h1>
          <StatusBadge status={data.status} />
          {data.is_manual ? <Badge variant="info">سفارش دستی</Badge> : null}
          <Button variant="secondary" size="sm" loading={downloadLoading} onClick={() => void handleDownload()}>
            دانلود فاکتور
          </Button>
        </div>
        <p className="mt-1 text-sm text-neutral-500">ثبت شده در {formatDateTime(data.created_at)}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>کار بعدی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.payment_proofs.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.payment_proofs.map((proof) => (
                <div key={proof.id} className="space-y-2">
                  <a
                    href={resolveMediaUrl(proof.image_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveMediaUrl(proof.image_url)}
                      alt="رسید پرداخت"
                      className="max-h-64 rounded-lg border border-neutral-200 object-contain"
                    />
                  </a>
                  <p className="text-xs text-neutral-500">
                    بارگذاری شده در {formatDateTime(proof.uploaded_at)}
                  </p>
                  {proof.payer_card_last4 ? (
                    <p className="text-xs text-neutral-600" dir="ltr">
                      کارت: ****{proof.payer_card_last4}
                    </p>
                  ) : null}
                  {proof.transfer_tracking ? (
                    <p className="text-xs text-neutral-600">پیگیری واریز: {proof.transfer_tracking}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          <OrderActions
            status={data.status}
            loading={actionLoading}
            onAction={handleAction}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>خریدار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-neutral-500">نام:</span> {data.buyer_name}
            </p>
            <p>
              <span className="text-neutral-500">تلفن:</span> {data.buyer_phone}
            </p>
            <p>
              <span className="text-neutral-500">آدرس:</span> {data.buyer_address}
            </p>
            {data.buyer_note && (
              <p>
                <span className="text-neutral-500">یادداشت:</span> {data.buyer_note}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>وضعیت مشتری</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-neutral-500">نوع خرید:</span>{" "}
              {data.customer_id ? "با حساب کاربری" : "مهمان (بدون حساب)"}
            </p>
            <p>
              <span className="text-neutral-500">تحویل به مشتری:</span>{" "}
              {deliveryReceiptLabel(data.receipt_status)}
            </p>
            <p>
              <span className="text-neutral-500">شکایت‌ها:</span> {data.complaint_count}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>روش پرداخت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="font-medium">{data.payment_method.display_name}</p>
          <Badge variant="info">{paymentMethodTypeLabel(data.payment_method.type)}</Badge>
          {data.payment_method.instructions && (
            <p className="text-neutral-600">{data.payment_method.instructions}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>کالاها</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderItemsPanel
            items={data.items}
                subtotalAmount={data.subtotal_amount}
                discountAmount={data.discount_amount}
                discountCode={data.discount_code}
                shippingAmount={data.shipping_amount}
                totalAmount={data.total_amount}
            productEditHref={(productId) => paths.seller.productEdit(productId)}
          />
        </CardContent>
      </Card>

      {canEditTracking && (
        <Card>
          <CardHeader>
            <CardTitle>کد پیگیری پست</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrackingSave} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  label="کد پیگیری"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="مثلاً ۲۴ رقم پست"
                  dir="ltr"
                />
              </div>
              <Button type="submit" loading={trackingLoading}>
                ذخیره کد پیگیری
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>تاریخچه وضعیت</CardTitle>
        </CardHeader>
        <CardContent>
          {data.status_history.length === 0 ? (
            <p className="text-sm text-neutral-500">هنوز تغییری تو وضعیت این سفارش ثبت نشده.</p>
          ) : (
            <ul className="space-y-3">
              {data.status_history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center gap-2 border-b border-neutral-100 pb-3 last:border-0"
                >
                  {entry.old_status && <StatusBadge status={entry.old_status} />}
                  <span className="text-neutral-400">→</span>
                  <StatusBadge status={entry.new_status} />
                  <span className="text-xs text-neutral-500">
                    {formatDateTime(entry.created_at)}
                  </span>
                  {entry.note && (
                    <span className="w-full text-sm text-neutral-600">{entry.note}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        open={pendingAction !== null}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={pendingAction ? ORDER_ACTION_LABELS[pendingAction] : "تایید"}
        confirmVariant={pendingAction === "confirm_payment" ? "primary" : "danger"}
        loading={actionLoading}
        onConfirm={() => pendingAction && executeAction(pendingAction)}
        onClose={() => setPendingAction(null)}
      />
    </div>
  );
}
