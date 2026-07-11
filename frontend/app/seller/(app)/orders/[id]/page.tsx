"use client";

import { use, useState } from "react";
import Link from "next/link";
import * as ordersApi from "@/lib/api/seller/orders";
import { paths } from "@/lib/auth/paths";
import { formatDateTime, formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import {
  actionToPatchStatus,
  isDestructiveAction,
  ORDER_ACTION_LABELS,
  type OrderAction,
} from "@/lib/seller/orderActions";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { OrderActions } from "@/components/seller/OrderActions";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function SellerOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const orderId = parseInt(id, 10);
  const toast = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<OrderAction | null>(null);

  const { data, error, isLoading, refetch } = useSellerFetch(
    () => ordersApi.getOrder(orderId),
    [orderId],
  );

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
      toast.error(err instanceof ApiError ? err.message : "اقدام ناموفق بود");
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  }

  function handleAction(action: OrderAction) {
    if (isDestructiveAction(action)) {
      setPendingAction(action);
    } else {
      void executeAction(action);
    }
  }

  if (isLoading) return <LoadingState message="در حال بارگذاری سفارش..." />;
  if (error || !data) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error ?? "سفارش پیدا نشد"}
        </p>
        <Link href={paths.seller.orders} className="text-sm text-brand hover:underline">
          بازگشت به سفارش‌ها
        </Link>
      </div>
    );
  }

  const confirmTitle =
    pendingAction === "reject_payment" ? "رد پرداخت" : "لغو سفارش";
  const confirmMessage =
    pendingAction === "reject_payment"
      ? "موجودی بازگردانده می‌شود و مشتری باید دوباره پرداخت کند."
      : "این کار سفارش را لغو می‌کند و در صورت نیاز موجودی را بازمی‌گرداند.";

  return (
    <div className="page-stack">
      <div>
        <Link href={paths.seller.orders} className="text-sm text-brand hover:underline">
          ← بازگشت به سفارش‌ها
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-neutral-900">{data.invoice_code}</h1>
          <StatusBadge status={data.status} />
        </div>
        <p className="mt-1 text-sm text-neutral-500">ثبت شده در {formatDateTime(data.created_at)}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>اقدامات</CardTitle>
        </CardHeader>
        <CardContent>
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
            <CardTitle>مالکیت</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-neutral-500">شناسه مشتری:</span>{" "}
              {data.customer_id ?? "سفارش مهمان"}
            </p>
            <p>
              <span className="text-neutral-500">رسید:</span>{" "}
              {data.receipt_status ?? "ثبت نشده"}
            </p>
            <p>
              <span className="text-neutral-500">اعتراض‌ها:</span> {data.complaint_count}
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
          <Badge variant="info">{data.payment_method.type}</Badge>
          {data.payment_method.instructions && (
            <p className="text-neutral-600">{data.payment_method.instructions}</p>
          )}
        </CardContent>
      </Card>

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
                <TableHeaderCell>قیمت واحد</TableHeaderCell>
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
          <div className="mt-4 flex justify-end gap-6 text-sm">
            <span className="text-neutral-500">
              جمع جزء: {formatMoney(data.subtotal_amount)}
            </span>
            <span className="font-semibold">
              مجموع: {formatMoney(data.total_amount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {data.payment_proofs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>رسیدهای پرداخت</CardTitle>
          </CardHeader>
          <CardContent>
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>تاریخچه وضعیت</CardTitle>
        </CardHeader>
        <CardContent>
          {data.status_history.length === 0 ? (
            <p className="text-sm text-neutral-500">هنوز سابقه‌ای وجود ندارد.</p>
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
        loading={actionLoading}
        onConfirm={() => pendingAction && executeAction(pendingAction)}
        onClose={() => setPendingAction(null)}
      />
    </div>
  );
}
