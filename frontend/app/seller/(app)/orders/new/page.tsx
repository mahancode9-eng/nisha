"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as ordersApi from "@/lib/api/seller/orders";
import * as productsApi from "@/lib/api/seller/products";
import * as paymentMethodsApi from "@/lib/api/seller/payment-methods";
import { paths } from "@/lib/auth/paths";
import { formatMoney } from "@/lib/format";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

type LineItem = {
  product_id: number;
  quantity: number;
};

export default function SellerManualOrderPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: products, isLoading: productsLoading } = useSellerFetch(
    () => productsApi.listProducts({ page: 1, page_size: 100 }),
    [],
  );
  const { data: paymentMethods, isLoading: paymentsLoading } = useSellerFetch(
    () => paymentMethodsApi.listPaymentMethods(),
    [],
  );

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [items, setItems] = useState<LineItem[]>([]);
  const [markPaid, setMarkPaid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  const productMap = useMemo(() => {
    const map = new Map<number, { title: string; price: string }>();
    for (const product of products?.items ?? []) {
      map.set(product.id, { title: product.title, price: product.price });
    }
    return map;
  }, [products]);

  function addItem() {
    const pid = parseInt(productId, 10);
    const qty = parseInt(quantity, 10);
    if (!pid || Number.isNaN(qty) || qty < 1) {
      toast.error("محصول و تعداد رو درست انتخاب کن.");
      return;
    }
    setItems((prev) => {
      const existing = prev.find((item) => item.product_id === pid);
      if (existing) {
        return prev.map((item) =>
          item.product_id === pid ? { ...item, quantity: item.quantity + qty } : item,
        );
      }
      return [...prev, { product_id: pid, quantity: qty }];
    });
    setQuantity("1");
  }

  async function handleSubmit() {
    if (!buyerName.trim() || !buyerPhone.trim() || !buyerAddress.trim()) {
      toast.error("نام، موبایل و آدرس خریدار لازمه.");
      return;
    }
    if (!paymentMethodId) {
      toast.error("روش پرداخت رو انتخاب کن.");
      return;
    }
    if (items.length === 0) {
      toast.error("حداقل یه محصول اضافه کن.");
      return;
    }
    setSaving(true);
    try {
      const created = await ordersApi.createManualOrder({
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim(),
        buyer_address: buyerAddress.trim(),
        buyer_note: buyerNote.trim() || null,
        payment_method_id: parseInt(paymentMethodId, 10),
        items,
        mark_paid: markPaid,
      });
      toast.success("سفارش دستی ثبت شد");
      setCreatedPassword(created.invoice_edit_password);
      setCreatedOrderId(created.order_id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "سفارش ثبت نشد. دوباره امتحان کن.");
    } finally {
      setSaving(false);
    }
  }

  if (productsLoading || paymentsLoading) {
    return <LoadingState message="داره فرم سفارش دستی رو آماده می‌کنه…" />;
  }

  if (createdOrderId !== null && createdPassword) {
    return (
      <div className="page-stack">
        <PageHeader description="سفارش دستی ثبت شد" />
        <Card>
          <CardContent className="space-y-3 py-5">
            <p className="text-sm text-foreground-muted">
              رمز ویرایش فاکتور رو همین الان به خریدار بده؛ دوباره نشون داده نمی‌شه.
            </p>
            <p className="rounded-xl border border-border bg-surface-muted px-3 py-2 font-mono text-lg" dir="ltr">
              {createdPassword}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => router.push(paths.seller.orderDetail(createdOrderId))}>
                دیدن سفارش
              </Button>
              <Link href={paths.seller.orders}>
                <Button variant="secondary">برگرد به سفارش‌ها</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activePayments = (paymentMethods ?? []).filter((method) => method.is_active);
  const activeProducts = (products?.items ?? []).filter((product) => product.is_active);

  return (
    <div className="page-stack">
      <PageHeader
        description="سفارشی که تو اینستاگرام یا حضوری گرفتی رو اینجا ثبت کن"
        action={
          <Link href={paths.seller.orders}>
            <Button variant="secondary">انصراف</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="نام خریدار"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              required
            />
            <Input
              label="موبایل"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              dir="ltr"
              required
            />
          </div>
          <Textarea
            label="آدرس"
            value={buyerAddress}
            onChange={(e) => setBuyerAddress(e.target.value)}
            rows={3}
            required
          />
          <Textarea
            label="یادداشت"
            value={buyerNote}
            onChange={(e) => setBuyerNote(e.target.value)}
            rows={2}
          />
          <Select
            label="روش پرداخت"
            value={paymentMethodId}
            onChange={(e) => setPaymentMethodId(e.target.value)}
          >
            <option value="">انتخاب کن</option>
            {activePayments.map((method) => (
              <option key={method.id} value={String(method.id)}>
                {method.display_name}
              </option>
            ))}
          </Select>

          <div className="rounded-xl border border-border p-3 space-y-3">
            <p className="text-sm font-medium">اقلام سفارش</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_100px_auto]">
              <Select label="محصول" value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">انتخاب کن</option>
                {activeProducts.map((product) => (
                  <option key={product.id} value={String(product.id)}>
                    {product.title} · {formatMoney(product.price)}
                  </option>
                ))}
              </Select>
              <Input
                label="تعداد"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <div className="flex items-end">
                <Button type="button" variant="secondary" onClick={addItem}>
                  افزودن
                </Button>
              </div>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-foreground-muted">هنوز کالایی اضافه نکردی.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {items.map((item) => {
                  const product = productMap.get(item.product_id);
                  return (
                    <li
                      key={item.product_id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2"
                    >
                      <span>
                        {product?.title ?? `محصول ${item.product_id}`} × {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() =>
                          setItems((prev) => prev.filter((row) => row.product_id !== item.product_id))
                        }
                      >
                        حذف
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={markPaid}
              onChange={(e) => setMarkPaid(e.target.checked)}
            />
            پرداخت رو همین الان تایید کن
          </label>

          <div className="flex justify-end">
            <Button loading={saving} onClick={() => void handleSubmit()}>
              ثبت سفارش دستی
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
