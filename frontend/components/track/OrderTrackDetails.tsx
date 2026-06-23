"use client";

import { useEffect, useState, type FormEvent } from "react";
import * as ordersApi from "@/lib/api/public/orders";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime, formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { PaymentInstructions } from "@/components/store/PaymentInstructions";
import { PaymentProofUpload } from "@/components/store/PaymentProofUpload";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import type { OrderTrackResponse } from "@/types/public/order";
import type { OrderStatus } from "@/types/order";

const EDITABLE_STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "PAYMENT_UPLOADED"];
const UPLOAD_STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "PAYMENT_UPLOADED"];

type OrderTrackDetailsProps = {
  order: OrderTrackResponse;
  password: string;
  onUpdated: (order: OrderTrackResponse) => void;
};

export function OrderTrackDetails({ order, password, onUpdated }: OrderTrackDetailsProps) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [buyerName, setBuyerName] = useState(order.buyer_name);
  const [buyerPhone, setBuyerPhone] = useState(order.buyer_phone);
  const [buyerAddress, setBuyerAddress] = useState(order.buyer_address);
  const [buyerNote, setBuyerNote] = useState(order.buyer_note ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBuyerName(order.buyer_name);
    setBuyerPhone(order.buyer_phone);
    setBuyerAddress(order.buyer_address);
    setBuyerNote(order.buyer_note ?? "");
  }, [order]);

  const canEdit = EDITABLE_STATUSES.includes(order.status);
  const canUpload = UPLOAD_STATUSES.includes(order.status);

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await ordersApi.editOrder(order.invoice_code, {
        invoice_edit_password: password,
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim(),
        buyer_address: buyerAddress.trim(),
        buyer_note: buyerNote.trim() || null,
      });
      const refreshed = await ordersApi.trackOrder({
        invoice_code: order.invoice_code,
        invoice_edit_password: password,
      });
      onUpdated(refreshed);
      setEditing(false);
      toast.success("جزئیات سفارش به‌روزرسانی شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "به‌روزرسانی ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  async function refreshOrder() {
    try {
      const refreshed = await ordersApi.trackOrder({
        invoice_code: order.invoice_code,
        invoice_edit_password: password,
      });
      onUpdated(refreshed);
    } catch {
      toast.error("به‌روزرسانی سفارش ناموفق بود");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">{order.invoice_code}</h2>
        <StatusBadge status={order.status} />
        <span className="text-sm text-foreground-muted">{formatDateTime(order.created_at)}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>فروشگاه</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0 text-sm">
          <p className="font-medium">{order.store.name}</p>
          {order.store.phone && <p>تلفن: {order.store.phone}</p>}
          {order.store.support_contact && <p>پشتیبانی: {order.store.support_contact}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>آیتم‌ها</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>محصول</TableHeaderCell>
                <TableHeaderCell>تعداد</TableHeaderCell>
                <TableHeaderCell>جمع</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.product_title}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatMoney(item.total_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-start font-semibold">
            جمع کل: {formatMoney(order.total_amount)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>جزئیات خریدار</CardTitle>
          {canEdit && !editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              ویرایش
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {editing ? (
            <form onSubmit={handleEdit} className="space-y-4">
              <Input label="نام" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required />
              <Input label="تلفن" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} required />
              <Textarea label="آدرس" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} rows={3} required />
              <Textarea label="یادداشت" value={buyerNote} onChange={(e) => setBuyerNote(e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Button type="submit" loading={saving}>
                  ذخیره
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  لغو
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-1 text-sm">
              <p>{order.buyer_name}</p>
              <p>{order.buyer_phone}</p>
              <p>{order.buyer_address}</p>
              {order.buyer_note && <p className="text-foreground-muted">{order.buyer_note}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentInstructions method={order.payment_method} />

      {order.payment_proofs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>رسیدهای پرداخت</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              {order.payment_proofs.map((proof) => (
                <div key={proof.id}>
                  <a href={resolveMediaUrl(proof.image_url)} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveMediaUrl(proof.image_url)}
                      alt="رسید پرداخت"
                      className="max-h-48 rounded-lg border border-border"
                    />
                  </a>
                  <p className="mt-1 text-xs text-foreground-muted">
                    {formatDateTime(proof.uploaded_at)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {canUpload && (
        <PaymentProofUpload
          invoiceCode={order.invoice_code}
          defaultPassword={password}
          onSuccess={refreshOrder}
        />
      )}
    </div>
  );
}
