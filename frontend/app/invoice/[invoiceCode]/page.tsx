"use client";

import { use, useState, type FormEvent } from "react";
import { ChatThread } from "@/components/chat/ChatThread";
import { InvoiceView } from "@/components/invoice/InvoiceView";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { useToast } from "@/contexts/ToastContext";
import { ApiError } from "@/lib/api/errors";
import { uploadPublicImage } from "@/lib/api/public/uploads";
import * as ordersApi from "@/lib/api/public/orders";
import { formatDateTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import type { ConversationDetail } from "@/types/chat";
import type { OrderTrackResponse } from "@/types/public/order";

type PageProps = {
  params: Promise<{ invoiceCode: string }>;
};

async function uploadSelectedImages(files: FileList | null): Promise<string[]> {
  if (!files || files.length === 0) return [];
  const uploads = await Promise.all(Array.from(files).map((file) => uploadPublicImage(file)));
  return uploads.map((item) => item.url);
}

export default function InvoicePage({ params }: PageProps) {
  const { invoiceCode } = use(params);
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [order, setOrder] = useState<OrderTrackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [openingChat, setOpeningChat] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewIsPublic, setReviewIsPublic] = useState(false);
  const [reviewImages, setReviewImages] = useState<FileList | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  async function handleUnlock(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await ordersApi.trackOrder({
        invoice_code: invoiceCode,
        invoice_edit_password: password,
      });
      setOrder(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "اعتبارنامه نامعتبر است");
    } finally {
      setLoading(false);
    }
  }

  async function openChat() {
    if (!order) return;
    setOpeningChat(true);
    setError(null);
    try {
      const created = await ordersApi.openOrderChat(invoiceCode, {
        invoice_code: invoiceCode,
        invoice_edit_password: password,
      });
      setConversation(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "باز کردن گفتگو ممکن نشد");
    } finally {
      setOpeningChat(false);
    }
  }

  async function handleReview(e: FormEvent) {
    e.preventDefault();
    if (!order) return;
    setReviewLoading(true);
    setError(null);
    try {
      const imageUrls = await uploadSelectedImages(reviewImages);
      await ordersApi.createPublicReview(invoiceCode, {
        invoice_code: invoiceCode,
        invoice_edit_password: password,
        order_id: order.order_id,
        rating: reviewRating,
        title: reviewTitle.trim() || null,
        comment: reviewComment.trim() || null,
        is_public: reviewIsPublic,
        image_urls: imageUrls,
      });
      setReviewTitle("");
      setReviewComment("");
      setReviewImages(null);
      setReviewIsPublic(false);
      setReviewRating(5);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ارسال نظر ممکن نشد");
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {!order ? (
        <Card className="print:hidden">
          <CardContent className="py-6">
            <h1 className="text-xl font-bold text-foreground">مشاهده فاکتور</h1>
            <p className="mt-1 text-sm text-foreground-muted">
              فاکتور <span className="font-mono">{invoiceCode}</span>
            </p>
            <form onSubmit={handleUnlock} className="mt-6 space-y-4">
              {error && <ErrorAlert message={error} />}
              <Input
                label="رمز فاکتور"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" loading={loading}>
                مشاهده فاکتور
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end gap-3 print:hidden">
            <Button variant="secondary" onClick={() => window.print()}>
              چاپ
            </Button>
          </div>

          <InvoiceView order={order} />

          <Card>
            <CardContent className="space-y-4 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-[0.2em] text-foreground-muted">گفتگوی سفارش</p>
                  <h2 className="text-lg font-semibold text-foreground">با فروشنده گفتگو کنید</h2>
                </div>
                <Button variant="secondary" size="sm" onClick={openChat} loading={openingChat}>
                  {conversation ? "به‌روزرسانی گفتگو" : "باز کردن گفتگو"}
                </Button>
              </div>
              {conversation ? (
                <ChatThread
                  conversation={conversation}
                  isLoading={false}
                  error={null}
                  ownSenderType="CUSTOMER"
                  onSend={async (payload) => {
                    try {
                      const sent = await ordersApi.sendOrderChatMessage(invoiceCode, {
                        invoice_code: invoiceCode,
                        invoice_edit_password: password,
                        ...payload,
                      });
                      setConversation((prev) =>
                        prev ? { ...prev, messages: [...prev.messages, sent] } : prev,
                      );
                    } catch (err) {
                      toast.error(
                        err instanceof ApiError ? err.message : "ارسال پیام ناموفق بود",
                      );
                    }
                  }}
                  header={
                    <div>
                      <h3 className="font-semibold text-foreground">{order.store.name}</h3>
                      <p className="text-xs text-foreground-muted">سفارش {order.invoice_code}</p>
                    </div>
                  }
                />
              ) : openingChat ? (
                <LoadingState message="در حال باز کردن گفتگو..." className="py-10" />
              ) : (
                <p className="text-sm text-foreground-muted">
                  با استفاده از اطلاعات فاکتور بالا می‌توانید گفتگوی این سفارش را باز کنید.
                </p>
              )}
            </CardContent>
          </Card>

          {order.status === "DELIVERED" && (
            <Card>
              <CardContent className="space-y-4 py-6">
                <div>
                  <p className="text-xs tracking-[0.2em] text-foreground-muted">نظر</p>
                  <h2 className="text-lg font-semibold text-foreground">بازخورد خود را ثبت کنید</h2>
                </div>
                <form onSubmit={handleReview} className="space-y-4">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-foreground">امتیاز</span>
                    <StarRating value={reviewRating} onChange={setReviewRating} size="md" />
                  </label>
                  <Input label="عنوان" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} />
                  <Textarea
                    label="نظر"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                  />
                  <Input
                    label="تصاویر"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setReviewImages(e.target.files)}
                  />
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={reviewIsPublic}
                      onChange={(e) => setReviewIsPublic(e.target.checked)}
                    />
                    برای تایید عمومی ارسال شود
                  </label>
                  <Button type="submit" loading={reviewLoading}>
                    ارسال نظر
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-3 py-6">
              <div className="flex flex-wrap gap-2">
                {order.store.trust_badges.length === 0 ? (
                  <Badge variant="neutral">هنوز نشان فروشگاهی ثبت نشده</Badge>
                ) : (
                  order.store.trust_badges.map((badge) => (
                    <Badge key={badge} variant="info">
                      {badge}
                    </Badge>
                  ))
                )}
              </div>
              <div className="space-y-2 text-sm text-foreground">
                <p className="font-medium text-foreground">{order.store.name}</p>
                {order.store.location && <p>{order.store.location}</p>}
                {order.store.phone && <p>{order.store.phone}</p>}
                {order.store.support_contact && <p>{order.store.support_contact}</p>}
              </div>
              {order.payment_proofs.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pt-2">
                  {order.payment_proofs.map((proof) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={proof.id}
                      src={resolveMediaUrl(proof.image_url)}
                      alt="رسید پرداخت"
                      className="h-24 w-24 shrink-0 rounded-xl border border-border object-cover"
                    />
                  ))}
                </div>
              )}
              <p className="text-xs text-foreground-muted">{formatDateTime(order.created_at)}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
