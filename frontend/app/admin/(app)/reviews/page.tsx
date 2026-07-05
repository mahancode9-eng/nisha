"use client";

import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import * as reviewsApi from "@/lib/api/admin/reviews";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { resolveMediaUrl } from "@/lib/media";
import type { AdminReviewListItem } from "@/types/admin/moderation";

const REVIEW_STATUS_LABELS: Record<AdminReviewListItem["status"], string> = {
  PRIVATE: "خصوصی",
  PENDING: "در انتظار بررسی",
  APPROVED: "تایید شد",
  REJECTED: "رد شد",
};

export default function AdminReviewsPage() {
  const toast = useToast();
  const [pendingOnly, setPendingOnly] = useState(true);
  const [moderationNote, setModerationNote] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchReviews = useCallback(() => reviewsApi.listReviews(pendingOnly), [pendingOnly]);
  const { data, error, isLoading, refetch } = useSellerFetch(fetchReviews, [pendingOnly]);

  async function moderate(review: AdminReviewListItem, approve: boolean) {
    setActionId(review.id);
    try {
      if (approve) {
        await reviewsApi.approveReview(review.id, { status: "APPROVED", moderation_note: moderationNote || null });
        toast.success("نظر تایید شد");
      } else {
        await reviewsApi.rejectReview(review.id, { status: "REJECTED", moderation_note: moderationNote || null });
        toast.success("نظر رد شد");
      }
      await refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "به‌روزرسانی نظر ممکن نشد");
    } finally {
      setActionId(null);
    }
  }

  const items = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        description="نظرات خریداران را پیش از عمومی شدن بررسی کنید."
        action={
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={pendingOnly}
              onChange={(e) => setPendingOnly(e.target.checked)}
            />
            فقط در انتظار
          </label>
        }
      />

      <Input
        label="یادداشت بررسی"
        value={moderationNote}
        onChange={(e) => setModerationNote(e.target.value)}
        placeholder="یادداشت اختیاری برای ثبت همراه تصمیم"
      />

      {isLoading && <TableSkeleton rows={5} columns={6} />}
      <ErrorAlert message={!isLoading && error ? error : ""} />

      {!isLoading && items.length === 0 && (
        <EmptyState title="نظری وجود ندارد" description="نظری با این فیلتر پیدا نشد." />
      )}

      {!isLoading && items.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>سفارش</TableHeaderCell>
              <TableHeaderCell>امتیاز</TableHeaderCell>
              <TableHeaderCell>وضعیت</TableHeaderCell>
              <TableHeaderCell>تصاویر</TableHeaderCell>
              <TableHeaderCell>نظر</TableHeaderCell>
              <TableHeaderCell>اقدامات</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((review) => (
              <TableRow key={review.id}>
                <TableCell>#{review.order_id}</TableCell>
                <TableCell>
                  <Badge variant="success">{review.rating} / 5</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      review.status === "APPROVED"
                        ? "success"
                        : review.status === "REJECTED"
                          ? "danger"
                        : review.status === "PENDING"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {REVIEW_STATUS_LABELS[review.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 overflow-x-auto">
                    {review.image_urls.length === 0 ? (
                      <span className="text-xs text-foreground-muted">هیچ‌کدام</span>
                    ) : (
                      review.image_urls.map((image) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={image}
                          src={resolveMediaUrl(image)}
                          alt=""
                          className="h-12 w-12 rounded-lg border border-border object-cover"
                        />
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-sm">
                  <p className="text-sm font-medium text-foreground">{review.title ?? "بدون عنوان"}</p>
                  <p className="line-clamp-2 text-sm text-foreground-muted">{review.comment ?? "بدون توضیح"}</p>
                  {review.moderation_note && (
                    <p className="mt-1 text-xs text-foreground-muted">یادداشت: {review.moderation_note}</p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={actionId === review.id || review.status !== "PENDING"}
                      onClick={() => void moderate(review, true)}
                    >
                      تایید
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actionId === review.id || review.status !== "PENDING"}
                      onClick={() => void moderate(review, false)}
                    >
                      رد
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
