"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { formatDateTime } from "@/lib/format";
import { listComplaints } from "@/lib/api/customer/orders";
import type { CustomerComplaint } from "@/types/customer/order";

const COMPLAINT_REASON_LABELS: Record<string, string> = {
  NON_DELIVERY: "عدم تحویل",
  DAMAGED: "آسیب‌دیده",
  WRONG_ITEM: "کالای اشتباه",
  OTHER: "سایر",
};

const COMPLAINT_STATUS_LABELS: Record<CustomerComplaint["status"], string> = {
  OPEN: "باز",
  IN_REVIEW: "در حال بررسی",
  RESOLVED: "حل‌شده",
};

export default function CustomerComplaintsPage() {
  const toast = useToast();
  const [complaints, setComplaints] = useState<CustomerComplaint[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listComplaints();
        if (!cancelled) setComplaints(data);
      } catch {
        if (!cancelled) {
          setComplaints([]);
          toast.error("خطا در بارگذاری اعتراض‌ها");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  if (complaints === null) {
    return <LoadingState message="در حال بارگذاری اعتراض‌ها..." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>اعتراض‌ها</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {complaints.length === 0 ? (
          <EmptyState
            title="اعتراضی ندارید"
            description="اعتراض‌های ثبت‌شده برای عدم تحویل اینجا نمایش داده می‌شوند."
          />
        ) : (
          complaints.map((complaint) => (
            <ListRow key={complaint.id}>
              <p className="font-medium text-foreground">{COMPLAINT_REASON_LABELS[complaint.reason] ?? complaint.reason}</p>
              <p className="mt-1 text-sm text-foreground-muted">{complaint.message}</p>
              <p className="mt-2 text-xs text-foreground-muted">
                {COMPLAINT_STATUS_LABELS[complaint.status]} | {formatDateTime(complaint.created_at)}
              </p>
            </ListRow>
          ))
        )}
      </CardContent>
    </Card>
  );
}
