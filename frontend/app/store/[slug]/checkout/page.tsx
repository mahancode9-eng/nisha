"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import * as storesApi from "@/lib/api/public/stores";
import * as customerOrdersApi from "@/lib/api/customer/orders";
import * as customerProfileApi from "@/lib/api/customer/profile";
import { uploadPublicFile } from "@/lib/api/public/uploads";
import { useCart } from "@/contexts/CartContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { ApiError } from "@/lib/api/errors";
import { formatMoney } from "@/lib/format";
import { publicPaths } from "@/lib/paths/public";
import { useToast } from "@/contexts/ToastContext";
import { OrderSuccessPanel } from "@/components/store/OrderSuccessPanel";
import { PaymentMethodSelector } from "@/components/store/PaymentMethodSelector";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Textarea } from "@/components/ui/Textarea";
import { paths } from "@/lib/auth/paths";
import type { CheckoutResponse, DiscountPreviewResponse, OrderItemFieldValueInput } from "@/types/public/checkout";
import type { PublicPaymentMethod, PublicProduct, PublicProductFormField } from "@/types/public/store";
import type { CustomerAddress } from "@/types/customer/profile";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type CheckoutFieldState = {
  value: string;
  checked: boolean;
  fileUrl: string | null;
  uploading: boolean;
};

type CheckoutFieldStateMap = Record<number, Record<string, CheckoutFieldState>>;

function formatAddress(address: CustomerAddress): string {
  return [
    address.address_line1,
    address.address_line2,
    address.city,
    address.province,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function createFieldState(): CheckoutFieldState {
  return {
    value: "",
    checked: false,
    fileUrl: null,
    uploading: false,
  };
}

function isFieldComplete(field: PublicProductFormField, draft: CheckoutFieldState | undefined): boolean {
  if (!draft) return false;
  if (field.field_type === "CHECKBOX") return true;
  if (field.field_type === "FILE_UPLOAD") return Boolean(draft.fileUrl);
  return Boolean(draft.value.trim());
}

function serializeFieldValues(
  field: PublicProductFormField,
  draft: CheckoutFieldState | undefined,
): OrderItemFieldValueInput | null {
  if (!draft) return null;
  if (field.field_type === "TEXT" || field.field_type === "TEXTAREA") {
    const value = draft.value.trim();
    return value ? { field_key: field.field_key, value } : null;
  }
  if (field.field_type === "NUMBER") {
    const value = draft.value.trim();
    if (!value) return null;
    const num = Number(value);
    if (Number.isNaN(num)) return null;
    return { field_key: field.field_key, value: num };
  }
  if (field.field_type === "DROPDOWN" || field.field_type === "RADIO") {
    const value = draft.value.trim();
    return value ? { field_key: field.field_key, value } : null;
  }
  if (field.field_type === "CHECKBOX") {
    return { field_key: field.field_key, value: draft.checked };
  }
  if (field.field_type === "FILE_UPLOAD") {
    return draft.fileUrl ? { field_key: field.field_key, file_url: draft.fileUrl } : null;
  }
  return null;
}

export default function CheckoutPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { items, subtotal, clearCart, reconcileWithProducts } = useCart();
  const { customer, isLoading: customerLoading } = useCustomerAuth();

  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PublicPaymentMethod[]>([]);
  const [storeProducts, setStoreProducts] = useState<PublicProduct[]>([]);
  const [fieldState, setFieldState] = useState<CheckoutFieldStateMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successOrder, setSuccessOrder] = useState<CheckoutResponse | null>(null);

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState("");

  // Roadmap task 17: optional discount code applied to the order.
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountPreviewResponse | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountChecking, setDiscountChecking] = useState(false);

  const selectedAddress = useMemo(
    () => customerAddresses.find((address) => String(address.id) === selectedAddressId) ?? null,
    [customerAddresses, selectedAddressId],
  );

  const productsById = useMemo(() => new Map(storeProducts.map((product) => [product.id, product])), [storeProducts]);

  const discountAmount = appliedDiscount ? parseFloat(appliedDiscount.discount_amount) : 0;
  const payableTotal = Math.max(subtotal - discountAmount, 0);

  useEffect(() => {
    if (successOrder) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const store = await storesApi.getStoreBySlug(slug);
        if (cancelled) return;
        reconcileWithProducts(store.products);
        setStoreProducts(store.products);
        setPaymentMethods(store.payment_methods);
        if (store.payment_methods.length > 0) {
          setPaymentMethodId(store.payment_methods[0].id);
        }
      } catch {
        if (!cancelled) setError("بارگذاری فروشگاه ممکن نیست.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, reconcileWithProducts, successOrder]);

  useEffect(() => {
    if (!customer) {
      setCustomerAddresses([]);
      setSelectedAddressId("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const addresses = await customerProfileApi.listAddresses();
        if (cancelled) return;
        setCustomerAddresses(addresses);
        const defaultAddress = addresses.find((address) => address.is_default) ?? addresses[0] ?? null;
        setSelectedAddressId(defaultAddress ? String(defaultAddress.id) : "");
      } catch {
        if (!cancelled) setCustomerAddresses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customer]);

  useEffect(() => {
    if (!customer) return;
    if (selectedAddress) {
      setBuyerName(selectedAddress.recipient_name);
      setBuyerPhone(selectedAddress.recipient_phone);
      setBuyerAddress(formatAddress(selectedAddress));
      setPostalCode(selectedAddress.postal_code ?? "");
      setAddressLine2(selectedAddress.address_line2 ?? "");
      setCity(selectedAddress.city ?? "");
      setProvince(selectedAddress.province ?? "");
      setCountry(selectedAddress.country ?? "");
      setAddressLabel(selectedAddress.label ?? "");
      setSaveAddress(false);
      return;
    }
    setBuyerName(customer.full_name);
    setBuyerPhone(customer.phone ?? "");
    setPostalCode(customer.postal_code ?? "");
    setBuyerAddress("");
    setAddressLine2("");
    setCity("");
    setProvince("");
    setCountry("");
    setAddressLabel("");
  }, [customer, selectedAddress]);

  useEffect(() => {
    if (!storeProducts.length) return;
    setFieldState((prev) => {
      const next: CheckoutFieldStateMap = {};
      for (const line of items) {
        const product = productsById.get(line.productId);
        if (!product) continue;
        const existing = prev[line.productId] ?? {};
        const entry: Record<string, CheckoutFieldState> = {};
        for (const field of product.form_fields) {
          entry[field.field_key] = existing[field.field_key] ?? createFieldState();
        }
        next[line.productId] = entry;
      }
      return next;
    });
  }, [items, productsById, storeProducts]);

  useEffect(() => {
    if (!loading && !successOrder && items.length === 0) {
      router.replace(publicPaths.store(slug));
    }
  }, [loading, items.length, router, slug, successOrder]);

  useEffect(() => {
    if (successOrder) return;
    const handler = (e: BeforeUnloadEvent) => {
      const hasInput = buyerName || buyerPhone || buyerAddress || buyerNote;
      if (hasInput) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [successOrder, buyerName, buyerPhone, buyerAddress, buyerNote]);

  function updateFieldState(productId: number, fieldKey: string, patch: Partial<CheckoutFieldState>) {
    setFieldState((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] ?? {}),
        [fieldKey]: {
          ...(prev[productId]?.[fieldKey] ?? createFieldState()),
          ...patch,
        },
      },
    }));
  }

  async function handleApplyDiscount() {
    const code = discountCode.trim();
    if (!code) return;
    setDiscountChecking(true);
    setDiscountError(null);
    try {
      const preview = await storesApi.previewDiscount(slug, { code, subtotal });
      setAppliedDiscount(preview);
      toast.success("کد تخفیف اعمال شد");
    } catch (err) {
      setAppliedDiscount(null);
      setDiscountError(err instanceof ApiError ? err.message : "بررسی کد تخفیف ممکن نشد");
    } finally {
      setDiscountChecking(false);
    }
  }

  function handleRemoveDiscount() {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError(null);
  }

  async function handleFieldFileUpload(
    productId: number,
    fieldKey: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    updateFieldState(productId, fieldKey, { uploading: true });
    try {
      const uploaded = await uploadPublicFile(file);
      updateFieldState(productId, fieldKey, {
        fileUrl: uploaded.url,
        uploading: false,
      });
    } catch (err) {
      updateFieldState(productId, fieldKey, { uploading: false });
      const msg = err instanceof ApiError ? err.message : "بارگذاری فایل ناموفق بود";
      setError(msg);
      toast.error(msg);
    } finally {
      event.target.value = "";
    }
  }

  function buildLineItemFieldValues(productId: number): OrderItemFieldValueInput[] {
    const product = productsById.get(productId);
    if (!product) return [];
    const drafts = fieldState[productId] ?? {};
    const values: OrderItemFieldValueInput[] = [];
    for (const field of product.form_fields) {
      const draft = drafts[field.field_key];
      const entry = serializeFieldValues(field, draft);
      if (entry) {
        values.push(entry);
      }
    }
    return values;
  }

  function validateFields(): boolean {
    const errors: Record<string, string> = {};
    for (const item of items) {
      const product = productsById.get(item.productId);
      if (!product) continue;
      const drafts = fieldState[item.productId] ?? {};
      for (const field of product.form_fields) {
        const draft = drafts[field.field_key];
        if (field.is_required && !isFieldComplete(field, draft)) {
          errors[`${item.productId}-${field.field_key}`] = `${field.label} الزامی است`;
        }
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) {
      toast.error("سبد خرید شما خالی است");
      return;
    }
    if (!paymentMethodId) {
      setError("لطفا یک روش پرداخت انتخاب کنید.");
      return;
    }
    if (!validateFields()) {
      toast.error("لطفا فیلدهای الزامی را تکمیل کنید");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim(),
        buyer_address: buyerAddress.trim(),
        buyer_note: buyerNote.trim() || null,
        payment_method_id: paymentMethodId,
        discount_code: appliedDiscount ? appliedDiscount.code : null,
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          field_values: buildLineItemFieldValues(item.productId),
        })),
        save_address: customer ? saveAddress : false,
        address_label: customer ? addressLabel.trim() || null : undefined,
        postal_code: customer ? postalCode.trim() || null : undefined,
        address_line2: customer ? addressLine2.trim() || null : undefined,
        city: customer ? city.trim() || null : undefined,
        province: customer ? province.trim() || null : undefined,
        country: customer ? country.trim() || null : undefined,
      };

      const order = customer
        ? await customerOrdersApi.createCustomerOrder(slug, payload)
        : await storesApi.createGuestOrder(slug, payload);

      clearCart();
      setSuccessOrder(order);
      toast.success("سفارش با موفقیت ثبت شد");

      if (customer && saveAddress) {
        try {
          await customerProfileApi.createAddress({
            label: addressLabel.trim() || null,
            recipient_name: buyerName.trim(),
            recipient_phone: buyerPhone.trim(),
            postal_code: postalCode.trim() || null,
            address_line1: buyerAddress.trim(),
            address_line2: addressLine2.trim() || null,
            city: city.trim() || null,
            province: province.trim() || null,
            country: country.trim() || null,
            is_default: false,
          });
        } catch {
          toast.warning("آدرس ذخیره نشد، اما سفارش ثبت شد");
        }
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "پرداخت ناموفق بود";
      setError(msg);
      toast.error(msg);
      try {
        const store = await storesApi.getStoreBySlug(slug);
        reconcileWithProducts(store.products);
      } catch {
        // ignore
      }
    } finally {
      setSubmitting(false);
    }
  }

  if ((loading || customerLoading) && !successOrder) return <LoadingState message="در حال بارگذاری پرداخت..." />;

  if (successOrder) {
    return (
      <div className="mx-auto max-w-2xl">
        <OrderSuccessPanel order={successOrder} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">پرداخت</h1>
        <p className="mt-1 text-foreground-muted">
          {customer
            ? "از آدرس‌های ذخیره‌شده خود استفاده کنید یا سفارش را برای گیرنده دیگری ثبت کنید."
            : "سفارش خود را تکمیل کنید. نیازی به حساب کاربری نیست."}
        </p>
      </div>

      {!customer && (
        <Card className="border-brand/20 bg-brand/5">
          <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">برای ذخیره این خرید در حساب خود، ابتدا وارد شوید.</p>
              <p className="text-sm text-foreground-muted">
                می‌توانید به‌صورت مهمان ادامه دهید، اما ورود باعث می‌شود سفارش‌ها، گفتگوها و دانلودها به پروفایل شما متصل بمانند.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`${paths.customer.login}?redirect=${encodeURIComponent(`/store/${slug}/checkout`)}`}>
                <Button variant="secondary">ورود</Button>
              </Link>
              <Button
                variant="ghost"
                type="button"
                onClick={() => document.getElementById("checkout-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                ادامه به‌صورت مهمان
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>خلاصه سفارش</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => {
            const product = productsById.get(item.productId);
            return (
              <div key={item.productId} className="space-y-2 rounded-2xl border border-border p-4">
                <div className="flex justify-between text-sm">
                  <span>
                    {item.title} × {item.quantity}
                  </span>
                  <span>{formatMoney(parseFloat(item.price) * item.quantity)}</span>
                </div>
                {product && product.form_fields.length > 0 && (
                  <Badge variant="info">{product.form_fields.length} فیلد سفارشی</Badge>
                )}
              </div>
            );
          })}

          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="grow">
                <Input
                  label="کد تخفیف (اختیاری)"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  disabled={Boolean(appliedDiscount)}
                  placeholder="مثلا SAVE10"
                />
              </div>
              {appliedDiscount ? (
                <Button type="button" variant="ghost" onClick={handleRemoveDiscount}>
                  حذف کد
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleApplyDiscount()}
                  loading={discountChecking}
                  disabled={!discountCode.trim()}
                >
                  اعمال کد
                </Button>
              )}
            </div>
            {discountError && <p className="text-sm text-red-600">{discountError}</p>}
          </div>

          <div className="space-y-1 border-t border-border pt-2">
            <div className="flex justify-between text-sm">
              <span>جمع کل</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>تخفیف ({appliedDiscount.code})</span>
                <span>− {formatMoney(appliedDiscount.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>مبلغ قابل پرداخت</span>
              <span>{formatMoney(payableTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
        {error && <ErrorAlert message={error} />}

        {items.some((item) => (productsById.get(item.productId)?.form_fields.length ?? 0) > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>گزینه‌های محصول</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => {
                const product = productsById.get(item.productId);
                if (!product || product.form_fields.length === 0) return null;
                const drafts = fieldState[item.productId] ?? {};
                return (
                  <div key={item.productId} className="space-y-4 rounded-2xl border border-border p-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{product.title}</h3>
                      <p className="text-sm text-foreground-muted">لطفا گزینه‌های الزامی این مورد را تکمیل کنید.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {product.form_fields.map((field) => {
                        const draft = drafts[field.field_key] ?? createFieldState();
                        const fieldErrorKey = `${item.productId}-${field.field_key}`;
                        if (field.field_type === "TEXT" || field.field_type === "TEXTAREA") {
                          return (
                            <Textarea
                              key={field.id}
                              label={field.label}
                              hint={field.help_text ?? undefined}
                              value={draft.value}
                              error={fieldErrors[fieldErrorKey]}
                              onChange={(e) => {
                                updateFieldState(item.productId, field.field_key, { value: e.target.value });
                                setFieldErrors((prev) => { const next = { ...prev }; delete next[fieldErrorKey]; return next; });
                              }}
                              rows={field.field_type === "TEXTAREA" ? 4 : 2}
                              required={field.is_required}
                              className="md:col-span-2"
                            />
                          );
                        }
                        if (field.field_type === "NUMBER") {
                          return (
                            <Input
                              key={field.id}
                              label={field.label}
                              hint={field.help_text ?? undefined}
                              type="number"
                              value={draft.value}
                              error={fieldErrors[fieldErrorKey]}
                              onChange={(e) => {
                                updateFieldState(item.productId, field.field_key, { value: e.target.value });
                                setFieldErrors((prev) => { const next = { ...prev }; delete next[fieldErrorKey]; return next; });
                              }}
                              required={field.is_required}
                            />
                          );
                        }
                        if (field.field_type === "DROPDOWN" || field.field_type === "RADIO") {
                          const fieldErr = fieldErrors[fieldErrorKey];
                          return (
                            <label key={field.id} className="space-y-2 text-sm text-foreground">
                              <span className="block font-medium">
                                {field.label}
                                {field.is_required ? " *" : ""}
                              </span>
                              {field.help_text && <span className="block text-xs text-foreground-muted">{field.help_text}</span>}
                              <select
                                className={`w-full rounded-lg border px-3 py-2 ${fieldErr ? "border-red-500 bg-surface" : "border-border bg-surface"}`}
                                value={draft.value}
                                onChange={(e) => {
                                  updateFieldState(item.productId, field.field_key, { value: e.target.value });
                                  setFieldErrors((prev) => { const next = { ...prev }; delete next[fieldErrorKey]; return next; });
                                }}
                                required={field.is_required}
                              >
                                <option value="">یک گزینه را انتخاب کنید</option>
                                {(field.options ?? []).map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {fieldErr && <p className="text-sm text-red-600">{fieldErr}</p>}
                            </label>
                          );
                        }
                        if (field.field_type === "CHECKBOX") {
                          return (
                            <label key={field.id} className="flex items-start gap-3 rounded-xl border border-border p-4 text-sm text-foreground md:col-span-2">
                              <input
                                type="checkbox"
                                checked={draft.checked}
                                onChange={(e) =>
                                  updateFieldState(item.productId, field.field_key, { checked: e.target.checked })
                                }
                                className="mt-1 rounded border-border"
                              />
                              <span>
                                <span className="block font-medium text-foreground">
                                  {field.label}
                                  {field.is_required ? " *" : ""}
                                </span>
                                {field.help_text && <span className="block text-xs text-foreground-muted">{field.help_text}</span>}
                              </span>
                            </label>
                          );
                        }
                        if (field.field_type === "FILE_UPLOAD") {
                          return (
                            <div key={field.id} className="space-y-2 md:col-span-2">
                              <label className="block text-sm font-medium text-foreground">
                                {field.label}
                                {field.is_required ? " *" : ""}
                              </label>
                              {field.help_text && <p className="text-xs text-foreground-muted">{field.help_text}</p>}
                              <div className="flex flex-wrap items-center gap-3">
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-muted px-4 py-2 text-sm text-foreground hover:bg-surface">
                                  <input
                                    type="file"
                                    onChange={(e) => void handleFieldFileUpload(item.productId, field.field_key, e)}
                                    className="hidden"
                                  />
                                  انتخاب فایل
                                </label>
                                {draft.uploading && <Badge variant="warning">در حال بارگذاری</Badge>}
                                {draft.fileUrl && <Badge variant="success">فایل پیوست شد</Badge>}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {customer && (
          <Card>
            <CardHeader>
              <CardTitle>آدرس‌های ذخیره‌شده</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customerAddresses.length > 0 ? (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-foreground">انتخاب آدرس</span>
                  <select
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    <option value="">گیرنده جدید</option>
                    {customerAddresses.map((address) => (
                      <option key={address.id} value={String(address.id)}>
                        {(address.label ?? address.recipient_name) + (address.is_default ? " (پیش‌فرض)" : "")}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="text-sm text-foreground-muted">
                  هنوز آدرس ذخیره‌شده‌ای ندارید. فرم پایین را پر کنید و در صورت تمایل ذخیره کنید.
                </p>
              )}
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                />
                این آدرس را در حساب من ذخیره کن
              </label>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{customer ? "مشخصات گیرنده" : "مشخصات شما"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="نام کامل" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required />
            <Input label="تلفن" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} required pattern="09[0-9]{9}" placeholder="09123456789" title="شماره موبایل باید با 09 شروع شود و 11 رقم باشد" />
            <Textarea
              label="آدرس تحویل"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              rows={3}
              required
            />

            {customer && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="کد پستی" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                <Input
                  label="برچسب آدرس"
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                  placeholder="خانه، محل کار و ..."
                />
                <Input
                  label="سطر دوم آدرس"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
                <Input label="شهر" value={city} onChange={(e) => setCity(e.target.value)} />
                <Input label="استان" value={province} onChange={(e) => setProvince(e.target.value)} />
                <Input label="کشور" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            )}

            <Textarea
              label="یادداشت (اختیاری)"
              value={buyerNote}
              onChange={(e) => setBuyerNote(e.target.value)}
              rows={2}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>روش پرداخت</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMethodSelector
              methods={paymentMethods}
              selectedId={paymentMethodId}
              onSelect={setPaymentMethodId}
            />
          </CardContent>
        </Card>

        <div className="sticky bottom-0 bg-background pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button type="submit" className="w-full" size="md" loading={submitting}>
            ثبت سفارش
          </Button>
        </div>
      </form>
    </div>
  );
}
