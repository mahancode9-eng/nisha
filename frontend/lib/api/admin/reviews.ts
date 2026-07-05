import { apiGet, apiPatch } from "@/lib/api/client";
import type {
  AdminReviewListItem,
  AdminReviewModerationRequest,
} from "@/types/admin/moderation";

export function listReviews(pendingOnly = true): Promise<AdminReviewListItem[]> {
  const query = `?pending_only=${pendingOnly ? "true" : "false"}`;
  return apiGet<AdminReviewListItem[]>(`/api/v1/admin/reviews${query}`);
}

export function approveReview(
  reviewId: number,
  body: AdminReviewModerationRequest,
): Promise<AdminReviewListItem> {
  return apiPatch<AdminReviewListItem>(`/api/v1/admin/reviews/${reviewId}/approve`, body);
}

export function rejectReview(
  reviewId: number,
  body: AdminReviewModerationRequest,
): Promise<AdminReviewListItem> {
  return apiPatch<AdminReviewListItem>(`/api/v1/admin/reviews/${reviewId}/reject`, body);
}
