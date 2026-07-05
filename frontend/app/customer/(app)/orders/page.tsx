"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime, formatMoney } from "@/lib/format";
import { paths } from "@/lib/auth/paths";
import { claimOrder, listActiveOrders, listOrders } from "@/lib/api/customer/orders";
import type { CustomerOrderListItem } from "@/types/customer/order";

function OrderRow({ order }: { order: CustomerOrderListItem }) {
  return (
    <ListRow className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={paths.customer.orderDetail(order.id)} className="font-medium text-foreground hover:underline">
            {order.invoice_code}
          </Link>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-foreground-muted">{order.buyer_name}</p>
        <p className="text-xs text-foreground-muted">{formatDateTime(order.created_at)}</p>
      </div>
      <div className="text-sm text-foreground">
        <p>{formatMoney(order.total_amount)}</p>
        <p className="text-xs text-foreground-muted">
          رسید: {order.receipt_status ?? "ثبت‌نشده"} | اعتراض‌ها: {order.complaint_count}
        </p>
      </div>
    </ListRow>
  );
}

export default function CustomerOrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<CustomerOrderListItem[] | null>(null);
  const [activeOrders, setActiveOrders] = useState<CustomerOrderListItem[] | null>(null);
  const [invoiceCode, setInvoiceCode] = useState("");
  const [invoicePassword, setInvoicePassword] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);

  async function refresh() {
    const [allOrders, active] = await Promise.all([listOrders(), listActiveOrders()]);
    setOrders(allOrders);
    setActiveOrders(active);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [allOrders, active] = await Promise.all([listOrders(), listActiveOrders()]);
        if (!cancelled) {
          setOrders(allOrders);
          setActiveOrders(active);
        }
      } catch {
        if (!cancelled) {
          setOrders([]);
          setActiveOrders([]);
          toast.error("خطا در بارگذاری سفارش‌ها");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function handleClaim(e: FormEvent) {
    e.preventDefault();
    setClaimLoading(true);
    setClaimError(null);
    try {
      await claimOrder({
        invoice_code: invoiceCode.trim(),
        invoice_password: invoicePassword,
      });
      setInvoiceCode("");
      setInvoicePassword("");
      await refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "بازیابی سفارش ناموفق بود";
      setClaimError(message);
      toast.error(message);
    } finally {
      setClaimLoading(false);
    }
  }

  if (!orders || !activeOrders) {
    return <LoadingState message="در حال بارگذاری سفارش‌ها..." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بازیابی سفارش قدیمی</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleClaim} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <Input
              label="کد فاکتور"
              value={invoiceCode}
              onChange={(e) => setInvoiceCode(e.target.value)}
              required
            />
            <Input
              label="رمز فاکتور"
              type="password"
              value={invoicePassword}
              onChange={(e) => setInvoicePassword(e.target.value)}
              required
            />
            <div className="flex items-end">
              <Button type="submit" loading={claimLoading}>
                بازیابی
              </Button>
            </div>
            {claimError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-3" role="alert">
                {claimError}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سفارش‌های فعال</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeOrders.length === 0 ? (
            <EmptyState title="سفارش فعالی ندارید" description="در حال حاضر هیچ سفارش در حال پردازشی ندارید." />
          ) : (
            activeOrders.map((order) => <OrderRow key={order.id} order={order} />)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>همه سفارش‌ها</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orders.length === 0 ? (
            <EmptyState title="هنوز سفارشی ندارید" description="یک سفارش ثبت کنید یا فاکتوری را بازیابی کنید تا شروع شود." />
          ) : (
            orders.map((order) => <OrderRow key={order.id} order={order} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
