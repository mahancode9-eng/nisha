"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import * as complaintsApi from "@/lib/api/admin/complaints";
import type { AdminComplaint, ComplaintStatus } from "@/types/admin/complaint";
import { paths } from "@/lib/auth/paths";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  OPEN: "باز",
  IN_REVIEW: "در حال بررسی",
  RESOLVED: "حل شده",
};

const STATUS_VARIANTS: Record<ComplaintStatus, "info" | "neutral" | "success"> = {
  OPEN: "info",
  IN_REVIEW: "neutral",
  RESOLVED: "success",
};

const FILTER_OPTIONS: Array<{ value: ComplaintStatus | ""; label: string }> = [
  { value: "", label: "همه" },
  { value: "OPEN", label: "باز" },
  { value: "IN_REVIEW", label: "در حال بررسی" },
  { value: "RESOLVED", label: "حل شده" },
];

export default function AdminComplaintsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "">("");
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchComplaints = useCallback(
    () =>
      complaintsApi.listComplaints({
        page,
        page_size: 20,
        status: statusFilter || undefined,
      }),
    [page, statusFilter],
  );

  const { data, error, isLoading, refetch } = useSellerFetch(fetchComplaints, [
    page,
    statusFilter,
  ]);

  async function setStatus(complaint: AdminComplaint, status: ComplaintStatus) {
    setActionId(complaint.id);
    try {
      await complaintsApi.updateComplaint(complaint.id, { status });
      toast.success("وضعیت شکایت به‌روزرسانی شد");
      await refetch();
    } catch {
      toast.error("به‌روزرسانی شکایت ناموفق بود");
    } finally {
      setActionId(null);
    }
  }

  const items = data?.items ?? [];

  return (
    <div className="page-stack">
      <PageHeader
        description="رسیدگی به شکایت خریداران و پیگیری وضعیت آن‌ها"
        action={<Badge variant="info">{data?.total ?? 0} شکایت</Badge>}
      />

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value || "all"}
            size="sm"
            variant={statusFilter === option.value ? undefined : "secondary"}
            onClick={() => {
              setPage(1);
              setStatusFilter(option.value);
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {isLoading && <TableSkeleton rows={6} columns={7} />}

      <ErrorAlert message={!isLoading && error ? error : ""} />

      {!isLoading && !error && data && data.total === 0 && (
        <EmptyState
          title="شکایتی وجود ندارد"
          description="شکایت‌های ثبت‌شده توسط خریداران اینجا نمایش داده می‌شوند."
        />
      )}

      {!isLoading && items.length > 0 && (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>سفارش</TableHeaderCell>
                <TableHeaderCell>فروشگاه</TableHeaderCell>
                <TableHeaderCell>خریدار</TableHeaderCell>
                <TableHeaderCell>موضوع</TableHeaderCell>
                <TableHeaderCell>وضعیت</TableHeaderCell>
                <TableHeaderCell>ثبت شده</TableHeaderCell>
                <TableHeaderCell>اقدامات</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="text-sm font-medium">{complaint.invoice_code}</TableCell>
                  <TableCell>
                    <Link
                      href={paths.admin.storeDetail(complaint.store_id)}
                      className="text-brand hover:underline"
                    >
                      {complaint.store_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{complaint.buyer_name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{complaint.reason}</div>
                      <div className="max-w-xs truncate text-xs text-foreground-muted">
                        {complaint.message}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[complaint.status]}>
                      {STATUS_LABELS[complaint.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDateTime(complaint.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {complaint.status !== "IN_REVIEW" && complaint.status !== "RESOLVED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionId === complaint.id}
                          onClick={() => setStatus(complaint, "IN_REVIEW")}
                        >
                          شروع بررسی
                        </Button>
                      )}
                      {complaint.status !== "RESOLVED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionId === complaint.id}
                          onClick={() => setStatus(complaint, "RESOLVED")}
                        >
                          حل شد
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data && (
            <PaginationControls
              page={data.page}
              totalPages={data.total_pages}
              total={data.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
