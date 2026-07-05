"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { ApiError } from "@/lib/api/errors";
import { uploadPublicImage } from "@/lib/api/public/uploads";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type {
  Product,
  ProductCreate,
  ProductFieldType,
  ProductFormFieldInput,
  ProductImageInput,
  ProductUpdate,
} from "@/types/seller/product";

type ProductFormProps = {
  initial?: Product;
  onSubmit: (data: ProductCreate | ProductUpdate) => Promise<void>;
  submitLabel?: string;
};

type EditableImage = ProductImageInput & { clientKey: string };
type EditableField = ProductFormFieldInput & { clientKey: string; optionsText: string; validationText: string };

const FIELD_TYPES: ProductFieldType[] = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "DROPDOWN",
  "RADIO",
  "CHECKBOX",
  "FILE_UPLOAD",
];

const FIELD_TYPE_LABELS: Record<ProductFieldType, string> = {
  TEXT: "متن کوتاه",
  TEXTAREA: "متن بلند",
  NUMBER: "عدد",
  DROPDOWN: "فهرست کشویی",
  RADIO: "گزینه‌های رادیویی",
  CHECKBOX: "چک‌باکس",
  FILE_UPLOAD: "بارگذاری فایل",
};

function normalizeImages(images: Product["images"]): EditableImage[] {
  return images.map((image, index) => ({
    clientKey: `${image.id}-${index}`,
    image_url: image.image_url,
    thumbnail_url: image.thumbnail_url,
    alt_text: image.alt_text ?? "",
    sort_order: image.sort_order,
    mime_type: image.mime_type,
    width: image.width,
    height: image.height,
  }));
}

function normalizeFields(fields: Product["form_fields"]): EditableField[] {
  return fields.map((field, index) => ({
    clientKey: `${field.id}-${index}`,
    field_key: field.field_key,
    label: field.label,
    field_type: field.field_type,
    sort_order: field.sort_order,
    is_required: field.is_required,
    placeholder: field.placeholder ?? "",
    help_text: field.help_text ?? "",
    optionsText: (field.options ?? [])
      .map((option) => `${option.label}|${option.value}`)
      .join("\n"),
    validationText: field.validation ? JSON.stringify(field.validation, null, 2) : "",
  }));
}

function emptyImage(): EditableImage {
  return {
    clientKey: crypto.randomUUID(),
    image_url: "",
    thumbnail_url: "",
    alt_text: "",
    sort_order: 0,
    mime_type: "",
    width: null,
    height: null,
  };
}

function emptyField(): EditableField {
  return {
    clientKey: crypto.randomUUID(),
    field_key: "",
    label: "",
    field_type: "TEXT",
    sort_order: 0,
    is_required: false,
    placeholder: "",
    help_text: "",
    optionsText: "",
    validationText: "",
  };
}

function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

async function uploadImageFile(file: File): Promise<ProductImageInput> {
  const uploaded = await uploadPublicImage(file);
  return {
    image_url: uploaded.url,
    thumbnail_url: uploaded.thumbnail_url,
    mime_type: uploaded.mime_type,
    width: uploaded.width,
    height: uploaded.height,
    alt_text: file.name.replace(/\.[^.]+$/, ""),
  };
}

export function ProductForm({
  initial,
  onSubmit,
  submitLabel = "ذخیره محصول",
}: ProductFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [stock, setStock] = useState(String(initial?.stock_quantity ?? 0));
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [images, setImages] = useState<EditableImage[]>(
    initial && initial.images.length > 0 ? normalizeImages(initial.images) : [emptyImage()],
  );
  const [fields, setFields] = useState<EditableField[]>(
    initial ? normalizeFields(initial.form_fields) : [],
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setPrice(initial?.price ?? "");
    setStock(String(initial?.stock_quantity ?? 0));
    setIsActive(initial?.is_active ?? true);
    setImages(initial && initial.images.length > 0 ? normalizeImages(initial.images) : [emptyImage()]);
    setFields(initial ? normalizeFields(initial.form_fields) : []);
  }, [initial]);

  const hasPrimaryImage = useMemo(() => images.some((image) => image.image_url.trim()), [images]);

  function setImage(index: number, patch: Partial<EditableImage>) {
    setImages((prev) => prev.map((image, i) => (i === index ? { ...image, ...patch } : image)));
  }

  function setField(index: number, patch: Partial<EditableField>) {
    setFields((prev) => prev.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleFileChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(null);
    try {
      const payload = await uploadImageFile(file);
      setImage(index, {
        image_url: payload.image_url,
        thumbnail_url: payload.thumbnail_url,
        mime_type: payload.mime_type,
        width: payload.width,
        height: payload.height,
        alt_text: payload.alt_text ?? "",
      });
    } catch (err) {
      setImageError(err instanceof ApiError ? err.message : "بارگذاری تصویر ناموفق بود");
    } finally {
      event.target.value = "";
    }
  }

  function toFormFieldInput(field: EditableField): ProductFormFieldInput {
    const payload: ProductFormFieldInput = {
      field_key: field.field_key.trim(),
      label: field.label.trim(),
      field_type: field.field_type,
      sort_order: field.sort_order,
      is_required: field.is_required,
      placeholder: (field.placeholder ?? "").trim() || null,
      help_text: (field.help_text ?? "").trim() || null,
      validation: null,
      options: null,
    };

    if (field.validationText.trim()) {
      try {
        payload.validation = JSON.parse(field.validationText);
      } catch {
        throw new Error(`JSON نامعتبر برای اعتبارسنجی ${field.label}`);
      }
    }

    if (field.optionsText.trim()) {
      payload.options = field.optionsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label, value] = line.split("|").map((part) => part.trim());
          return {
            label: label || value,
            value: value || label,
          };
        });
    }

    return payload;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);
    if (!title.trim()) {
      setError("عنوان الزامی است.");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError("قیمت باید بزرگ‌تر از 0 باشد.");
      return;
    }
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError("موجودی باید 0 یا بیشتر باشد.");
      return;
    }

    const payloadImages = images
      .map((image, index) => ({
        image_url: image.image_url.trim(),
        thumbnail_url: image.thumbnail_url?.trim() || null,
        alt_text: image.alt_text?.trim() || null,
        sort_order: index,
        mime_type: image.mime_type?.trim() || null,
        width: image.width ?? null,
        height: image.height ?? null,
      }))
      .filter((image) => image.image_url);

    let payloadFields: ProductFormFieldInput[];
    try {
      payloadFields = fields.map((field, index) => {
        const payload = toFormFieldInput({ ...field, sort_order: index });
        payload.sort_order = index;
        if (
          (payload.field_type === "DROPDOWN" || payload.field_type === "RADIO") &&
          (!payload.options || payload.options.length === 0)
        ) {
          throw new Error(`گزینه‌ها برای ${payload.label} الزامی هستند`);
        }
        if (!payload.field_key || !payload.label) {
          throw new Error("هر فیلد سفارشی به یک کلید و یک برچسب نیاز دارد.");
        }
        return payload;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "پیکربندی فیلد سفارشی نامعتبر است");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        price: priceNum,
        stock_quantity: stockNum,
        is_active: isActive,
        images: payloadImages.length > 0 ? payloadImages : null,
        form_fields: payloadFields.length > 0 ? payloadFields : null,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیره ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          {imageError && (
            <p className="rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300" role="alert">
              {imageError}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="عنوان" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Input
              label="مقدار موجودی"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
            <Textarea
              label="توضیحات"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="md:col-span-2"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">قیمت</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="block w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <span className="whitespace-nowrap text-sm text-foreground-muted">تومان</span>
              </div>
            </div>
              <div className="flex items-end">
                <label htmlFor="product-is-active" className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    id="product-is-active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-border"
                  />
                  محصول فعال است
                </label>
              </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.2em] text-foreground-muted">گالری</p>
                <p className="text-sm text-foreground-muted">
                  تصاویر را بارگذاری کنید، تصویر اصلی را تعیین کنید و ترتیب آن‌ها را برای گالری عمومی مشخص کنید.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setImages((prev) => [...prev, emptyImage()])}>
                  افزودن تصویر
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {images.map((image, index) => (
                <div key={image.clientKey} className="grid gap-4 rounded-2xl border border-border p-4 lg:grid-cols-[180px_1fr]">
                  <div className="space-y-3">
                    <div className="aspect-square overflow-hidden rounded-xl bg-surface-muted">
                      {image.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image.thumbnail_url || image.image_url}
                          alt={image.alt_text || title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
                          بدون تصویر
                        </div>
                      )}
                    </div>
                    <input
                      ref={(el) => {
                        fileInputs.current[image.clientKey] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => void handleFileChange(index, event)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => fileInputs.current[image.clientKey]?.click()}
                    >
                      بارگذاری تصویر
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="آدرس تصویر"
                        value={image.image_url}
                        onChange={(e) => setImage(index, { image_url: e.target.value })}
                      />
                      <Input
                        label="آدرس بندانگشتی"
                        value={image.thumbnail_url ?? ""}
                        onChange={(e) => setImage(index, { thumbnail_url: e.target.value })}
                      />
                      <Input
                        label="متن جایگزین"
                        value={image.alt_text ?? ""}
                        onChange={(e) => setImage(index, { alt_text: e.target.value })}
                      />
                      <Input
                        label="نوع MIME"
                        value={image.mime_type ?? ""}
                        onChange={(e) => setImage(index, { mime_type: e.target.value })}
                      />
                      <Input
                        label="عرض"
                        type="number"
                        min="1"
                        value={image.width ?? ""}
                        onChange={(e) =>
                          setImage(index, {
                            width: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                      <Input
                        label="ارتفاع"
                        type="number"
                        min="1"
                        value={image.height ?? ""}
                        onChange={(e) =>
                          setImage(index, {
                            height: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setImages((prev) => moveItem(prev, index, -1))} disabled={index === 0}>
                        بالا
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setImages((prev) => moveItem(prev, index, 1))} disabled={index === images.length - 1}>
                        پایین
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setImages((prev) => {
                            const next = [...prev];
                            const [selected] = next.splice(index, 1);
                            next.unshift(selected);
                            return next;
                          });
                        }}
                        disabled={index === 0}
                      >
                        اصلی
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        onClick={() => removeImage(index)}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {hasPrimaryImage ? null : (
              <p className="text-sm text-amber-700 dark:text-amber-300">حداقل یک نشانی تصویر اضافه کنید یا یک تصویر بارگذاری کنید تا محصول در صفحه عمومی نمایش داده شود.</p>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.2em] text-foreground-muted">فیلدهای سفارشی</p>
                <p className="text-sm text-foreground-muted">
                  فرم پرداخت این محصول را بسازید. گزینه‌ها را در هر خط به‌شکل `برچسب|مقدار` بنویسید.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => setFields((prev) => [...prev, emptyField()])}>
                افزودن فیلد
              </Button>
            </div>
            <div className="space-y-4">
              {fields.length === 0 ? (
                <p className="text-sm text-foreground-muted">این محصول به فیلد سفارشی در پرداخت نیاز ندارد.</p>
              ) : (
                fields.map((field, index) => (
                  <div key={field.clientKey} className="rounded-2xl border border-border p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="کلید فیلد"
                        value={field.field_key}
                        onChange={(e) => setField(index, { field_key: e.target.value })}
                      />
                      <Input
                        label="برچسب"
                        value={field.label}
                        onChange={(e) => setField(index, { label: e.target.value })}
                      />
                      <label className="space-y-2 text-sm text-foreground">
                        <span className="block font-medium">نوع فیلد</span>
                        <select
                          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                          value={field.field_type}
                          onChange={(e) => {
                            const nextType = e.target.value as ProductFieldType;
                            setField(index, {
                              field_type: nextType,
                              optionsText:
                                nextType === "DROPDOWN" || nextType === "RADIO"
                                  ? field.optionsText
                                  : "",
                            });
                          }}
                          >
                          {FIELD_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {FIELD_TYPE_LABELS[type]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Input
                        label="متن راهنما"
                        value={field.placeholder ?? ""}
                        onChange={(e) => setField(index, { placeholder: e.target.value })}
                      />
                      <Input
                        label="توضیح کمکی"
                        value={field.help_text ?? ""}
                        onChange={(e) => setField(index, { help_text: e.target.value })}
                      />
                      <Textarea
                        label="JSON اعتبارسنجی"
                        hint='نمونه: {"min": 1, "max": 10}'
                        value={field.validationText}
                        onChange={(e) => setField(index, { validationText: e.target.value })}
                        rows={4}
                        className="md:col-span-2"
                      />
                      {(field.field_type === "DROPDOWN" || field.field_type === "RADIO") && (
                        <Textarea
                          label="گزینه‌ها"
                          hint="هر خط در قالب برچسب|مقدار"
                          value={field.optionsText}
                          onChange={(e) => setField(index, { optionsText: e.target.value })}
                          rows={4}
                          className="md:col-span-2"
                        />
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label htmlFor={`field-required-${field.clientKey}`} className="flex items-center gap-2 text-sm text-foreground">
                        <input
                          id={`field-required-${field.clientKey}`}
                          type="checkbox"
                          checked={field.is_required}
                          onChange={(e) => setField(index, { is_required: e.target.checked })}
                        />
                        الزامی
                      </label>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setFields((prev) => moveItem(prev, index, -1))} disabled={index === 0}>
                        بالا
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setFields((prev) => moveItem(prev, index, 1))} disabled={index === fields.length - 1}>
                        پایین
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        onClick={() => removeField(index)}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <Button type="submit" loading={loading}>
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
