"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/contexts/ToastContext";
import { uploadPublicImage } from "@/lib/api/public/uploads";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StarRating } from "@/components/ui/StarRating";
import { formatDateTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { createReview, getOrder, listOrders, listReviews } from "@/lib/api/customer/orders";
import type { CustomerOrderDetail, CustomerReview } from "@/types/customer/order";

const REVIEW_STATUS_LABELS: Record<CustomerReview["status"], string> = {
  PRIVATE: "فقط برای فروشنده",
  PENDING: "در انتظار بررسی",
  APPROVED: "تایید شد",
  REJECTED: "رد شد",
};

async function uploadReviewImages(files: FileList | null): Promise<string[]> {
  if (!files || files.length === 0) return [];
  const uploads = await Promise.all(
    Array.from(files).map((file) => uploadPublicImage(file, { preferCustomer: true })),
  );
  return uploads.map((item) => item.url);
}

export default function CustomerReviewsPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<CustomerOrderDetail[] | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<CustomerReview[] | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [images, setImages] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const orderList = await listOrders();
        const delivered = orderList.filter((order) => order.status === "DELIVERED");
        const detailed = await Promise.all(delivered.map((order) => getOrder(order.id)));
        if (cancelled) return;
        setOrders(detailed);
        setSelectedOrderId(detailed[0]?.id ?? null);
      } catch {
        if (!cancelled) {
          setOrders([]);
          toast.error("سفارش‌ها باز نشد. صفحه رو دوباره بارگذاری کن.");
        }
      }
    })();

    (async () => {
      try {
        const data = await listReviews();
        if (!cancelled) setReviews(data);
      } catch {
        if (!cancelled) {
          setReviews([]);
          toast.error("نظرها باز نشد. صفحه رو دوباره بارگذاری کن.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const selectedOrder = useMemo(
    () => orders?.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;
    setShowConfirm(true);
  }

  async function confirmSubmit() {
    if (!selectedOrder) return;
    setShowConfirm(false);
    setSaving(true);
    setError(null);
    try {
      const imageUrls = await uploadReviewImages(images);
      const created = await createReview({
        order_id: selectedOrder.id,
        rating,
        title: title.trim() || null,
        comment: comment.trim() || null,
        is_public: isPublic,
        image_urls: imageUrls,
      });
      setReviews((prev) => [created, ...(prev ?? [])]);
      setTitle("");
      setComment("");
      setImages(null);
      setIsPublic(false);
      setRating(5);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "نظر ذخیره نشد. دوباره امتحان کن.");
    } finally {
      setSaving(false);
    }
  }

  if (orders === null || reviews === null) {
    return <LoadingState message="داره نظرها بارگذاری می‌شن…" />;
  }

  return (
    <div className="page-stack">
      <Card>
        <CardHeader>
          <CardTitle>برای کدوم خرید نظر می‌دی؟</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <EmptyState
              title="هنوز سفارش تحویل‌شده‌ای نداری"
              description="بعد از تحویل هر سفارش، اینجا می‌تونی درباره‌اش نظر بدی."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {orders.map((order) => {
                const active = order.id === selectedOrderId;
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                      className={`rounded-3xl border p-4 text-start transition ${
                      active ? "border-brand bg-brand/10" : "border-border bg-surface hover:bg-surface-muted"
                      }`}
                    >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                    <p className="font-semibold text-foreground">{order.invoice_code}</p>
                    <p className="text-xs text-foreground-muted">{formatDateTime(order.created_at)}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="mt-3 space-y-2">
                      {order.items.map((item) => (
                        <div key={`${order.id}-${item.product_id ?? item.id ?? item.product_title_snapshot}`} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-muted px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.product_title_snapshot}</p>
                            <p className="text-xs text-foreground-muted">تعداد {item.quantity}</p>
                          </div>
                          <span className="text-sm text-foreground">{item.total_price}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ثبت نظر</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedOrder ? (
            <EmptyState title="اول یک سفارش انتخاب کن" description="از فهرست بالا، سفارشی که تحویل گرفتی رو انتخاب کن." />
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <Input label="سفارش انتخاب‌شده" value={selectedOrder.invoice_code} readOnly />
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-foreground">امتیاز</span>
                <StarRating value={rating} onChange={setRating} size="md" />
              </label>
              <Input
                label="عنوان"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="md:col-span-2"
              />
              <Textarea
                label="نظر"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="md:col-span-2"
              />
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(e.target.files)}
                className="md:col-span-2"
              />
              <label className="flex items-center gap-2 text-sm text-neutral-700 md:col-span-2">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                نظرم بعد از تایید، تو صفحه فروشگاه نشون داده بشه
              </label>
              {error && (
                <p className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" loading={saving} className="md:col-span-2">
                ذخیره نظر
              </Button>
            </form>
          )}
          <ConfirmModal
            open={showConfirm}
            title="ثبت نظر"
            message="نظر ثبت بشه؟"
            confirmLabel="ثبت نظر"
            loading={saving}
            onConfirm={confirmSubmit}
            onClose={() => setShowConfirm(false)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>نظرهات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviews.length === 0 ? (
            <EmptyState title="هنوز نظری ندادی" description="نظرهایی که درباره خریدات می‌دی، اینجا می‌مونن." />
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="rounded-3xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">سفارش #{review.order_id}</p>
                  <Badge variant={review.status === "APPROVED" ? "success" : review.status === "REJECTED" ? "danger" : "warning"}>
                    {REVIEW_STATUS_LABELS[review.status]}
                  </Badge>
                  <span className="text-sm text-foreground-muted">{review.rating} / 5</span>
                </div>
                {review.title && <p className="mt-1 font-medium text-foreground">{review.title}</p>}
                {review.comment && <p className="mt-1 text-sm text-foreground-muted">{review.comment}</p>}
                {review.moderation_note && (
                  <p className="mt-2 text-xs text-foreground-muted">یادداشت بررسی: {review.moderation_note}</p>
                )}
                {review.image_urls.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {review.image_urls.map((imageUrl) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={imageUrl}
                        src={resolveMediaUrl(imageUrl)}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-foreground-muted">{formatDateTime(review.created_at)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
