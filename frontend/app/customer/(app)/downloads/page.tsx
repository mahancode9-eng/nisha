"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { formatDateTime } from "@/lib/format";
import { downloadInvoice, listOrders } from "@/lib/api/customer/orders";
import type { CustomerOrderListItem } from "@/types/customer/order";

export default function CustomerDownloadsPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<CustomerOrderListItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listOrders();
        if (!cancelled) setOrders(data);
      } catch {
        if (!cancelled) {
          setOrders([]);
          toast.error("خطا در بارگذاری دانلودها");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function handleDownload(orderId: number, invoiceCode: string) {
    try {
      const blob = await downloadInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceCode}.html`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("دانلود فاکتور ممکن نشد");
    }
  }

  if (orders === null) {
    return <LoadingState message="در حال بارگذاری دانلودها..." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>دانلودها</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.length === 0 ? (
          <EmptyState title="دانلودی ندارید" description="برای دانلود فاکتور، سفارشی ثبت یا بازیابی کنید." />
        ) : (
          orders.map((order) => (
            <ListRow key={order.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{order.invoice_code}</p>
                <p className="text-sm text-foreground-muted">{formatDateTime(order.created_at)}</p>
              </div>
              <Button variant="secondary" onClick={() => handleDownload(order.id, order.invoice_code)}>
                دانلود فاکتور
              </Button>
            </ListRow>
          ))
        )}
      </CardContent>
    </Card>
  );
}
