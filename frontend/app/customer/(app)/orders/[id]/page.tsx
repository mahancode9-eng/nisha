"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import { ChatThread } from "@/components/chat/ChatThread";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime, formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { uploadPublicImage } from "@/lib/api/public/uploads";
import * as conversationsApi from "@/lib/api/customer/conversations";
import {
  createComplaint,
  createReview,
  downloadInvoice,
  getOrder,
  setReceiptStatus,
} from "@/lib/api/customer/orders";
import { useToast } from "@/contexts/ToastContext";
import type { ConversationDetail } from "@/types/chat";
import type { CustomerOrderDetail } from "@/types/customer/order";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function uploadSelectedImages(files: FileList | null): Promise<string[]> {
  if (!files || files.length === 0) return [];
  const uploads = await Promise.all(Array.from(files).map((file) => uploadPublicImage(file)));
  return uploads.map((item) => item.url);
}

export default function CustomerOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const orderId = Number(id);
  const toast = useToast();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [complaintMessage, setComplaintMessage] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewIsPublic, setReviewIsPublic] = useState(false);
  const [reviewImages, setReviewImages] = useState<FileList | null>(null);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [openingChat, setOpeningChat] = useState(false);

  async function refresh() {
    const data = await getOrder(orderId);
    setOrder(data);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getOrder(orderId);
        if (!cancelled) setOrder(data);
      } catch {
        if (!cancelled) setError("بارگذاری سفارش ممکن نشد");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function handleReceipt(status: "RECEIVED" | "NOT_RECEIVED") {
    if (!order) return;
    setReceiptLoading(true);
    try {
      const updated = await setReceiptStatus(order.id, { receipt_status: status });
      setOrder({ ...order, receipt_status: updated.receipt_status });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "به‌روزرسانی وضعیت رسید ممکن نشد");
    } finally {
      setReceiptLoading(false);
    }
  }

  async function handleComplaint(e: FormEvent) {
    e.preventDefault();
    if (!order) return;
    setComplaintLoading(true);
    setError(null);
    try {
      await createComplaint(order.id, { message: complaintMessage.trim(), reason: "NON_DELIVERY" });
      setComplaintMessage("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ثبت اعتراض ممکن نشد");
    } finally {
      setComplaintLoading(false);
    }
  }

  async function handleReview(e: FormEvent) {
    e.preventDefault();
    if (!order) return;
    setReviewLoading(true);
    setError(null);
    try {
      const imageUrls = await uploadSelectedImages(reviewImages);
      await createReview({
        order_id: order.id,
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
      toast.success(reviewIsPublic ? "نظر برای تایید ارسال شد" : "نظر ذخیره شد");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیره نظر ممکن نشد");
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleDownload() {
    if (!order) return;
    try {
      const blob = await downloadInvoice(order.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.invoice_code}.html`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "دانلود ناموفق بود");
    }
  }

  async function openChat() {
    if (!order) return;
    setOpeningChat(true);
    setError(null);
    try {
      const created = await conversationsApi.createConversation({ order_id: order.id });
      const full = await conversationsApi.getConversation(created.id);
      setConversation(full);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "باز کردن گفتگو ممکن نشد");
    } finally {
      setOpeningChat(false);
    }
  }

  if (loading || !order) {
    return <LoadingState message="در حال بارگذاری سفارش..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-neutral-900">{order.invoice_code}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-neutral-500">{formatDateTime(order.created_at)}</span>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اقلام</CardTitle>
            </CardHeader>
            <CardContent>
              <Table embedded>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>آیتم</TableHeaderCell>
                    <TableHeaderCell>تعداد</TableHeaderCell>
                    <TableHeaderCell>جمع</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.product_title_snapshot}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatMoney(item.total_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-3 text-right font-semibold">
                مجموع: {formatMoney(order.total_amount)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>جزئیات خریدار</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                دانلود فاکتور
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium text-neutral-900">{order.buyer_name}</p>
              <p>{order.buyer_phone}</p>
              <p className="whitespace-pre-wrap">{order.buyer_address}</p>
              {order.buyer_note && <p className="text-neutral-600">{order.buyer_note}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>گفتگوی سفارش</CardTitle>
              <Button variant="secondary" size="sm" onClick={openChat} loading={openingChat}>
                {conversation ? "تازه‌سازی گفتگو" : "باز کردن گفتگو"}
              </Button>
            </CardHeader>
            <CardContent padding="flush">
              {conversation ? (
                <div className="p-0">
                  <ChatThread
                    conversation={conversation}
                    isLoading={false}
                    error={null}
                    ownSenderType="CUSTOMER"
                    onSend={async (payload) => {
                      const sent = await conversationsApi.sendMessage(conversation.id, payload);
                      setConversation((prev) =>
                        prev ? { ...prev, messages: [...prev.messages, sent] } : prev,
                      );
                    }}
                    header={
                      <div>
                        <h2 className="font-semibold text-neutral-900">{order.store.name}</h2>
                        <p className="text-xs text-neutral-500">سفارش {order.invoice_code}</p>
                      </div>
                    }
                  />
                </div>
              ) : (
                <div className="p-6">
                    <p className="text-sm text-neutral-600">
                      گفتگوی سفارش را باز کنید تا درباره این خرید با فروشنده صحبت کنید.
                    </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>وضعیت رسید</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant={order.receipt_status === "RECEIVED" ? "primary" : "secondary"}
                loading={receiptLoading}
                onClick={() => handleReceipt("RECEIVED")}
              >
                دریافت شد
              </Button>
              <Button
                type="button"
                variant={order.receipt_status === "NOT_RECEIVED" ? "primary" : "secondary"}
                loading={receiptLoading}
                onClick={() => handleReceipt("NOT_RECEIVED")}
              >
                دریافت نشده
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>اعتراض</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleComplaint} className="space-y-4">
                <Textarea
                  label="اعتراض به عدم تحویل"
                  value={complaintMessage}
                  onChange={(e) => setComplaintMessage(e.target.value)}
                  rows={4}
                  required
                />
                <Button type="submit" loading={complaintLoading}>
                  ثبت اعتراض
                </Button>
              </form>
            </CardContent>
          </Card>

          {order.status === "DELIVERED" && (
            <Card>
              <CardHeader>
                <CardTitle>نظر</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReview} className="space-y-4">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">امتیاز</span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full"
                    />
                    <p className="mt-1 text-sm text-neutral-500">{reviewRating} / 5</p>
                  </label>
                  <Input
                    label="عنوان"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                  />
                  <Textarea
                    label="نظر"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                  />
                  <label className="flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={reviewIsPublic}
                      onChange={(e) => setReviewIsPublic(e.target.checked)}
                    />
                    برای تایید عمومی ارسال شود
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setReviewImages(e.target.files)}
                  />
                  <Button type="submit" loading={reviewLoading}>
                    ذخیره نظر
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>فروشگاه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium text-neutral-900">{order.store.name}</p>
              {order.store.phone && <p>{order.store.phone}</p>}
              {order.store.support_contact && <p>{order.store.support_contact}</p>}
              {order.store.trust_badges.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {order.store.trust_badges.map((badge) => (
                    <Badge key={badge} variant="info">
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>روش پرداخت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium text-neutral-900">{order.payment_method.display_name}</p>
              {order.payment_method.card_number && <p>کارت: {order.payment_method.card_number}</p>}
              {order.payment_method.wallet_address && (
                <p className="break-all">کیف پول: {order.payment_method.wallet_address}</p>
              )}
              {order.payment_method.instructions && (
                <p className="text-neutral-600">{order.payment_method.instructions}</p>
              )}
            </CardContent>
          </Card>

          {order.payment_proofs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>رسیدهای پرداخت</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.payment_proofs.map((proof) => (
                  <a
                    key={proof.id}
                    href={resolveMediaUrl(proof.image_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-lg border border-neutral-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveMediaUrl(proof.image_url)}
                      alt="رسید پرداخت"
                      className="max-h-48 w-full object-cover"
                    />
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>تاریخچه وضعیت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {order.status_history.map((item) => (
                <div key={item.id} className="rounded-lg border border-neutral-200 p-3">
                  <StatusBadge status={item.new_status} />
                  {item.note && <p className="text-neutral-600">{item.note}</p>}
                  <p className="text-xs text-neutral-400">{formatDateTime(item.created_at)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
