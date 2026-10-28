"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api/errors";
import { paths } from "@/lib/auth/paths";
import { uploadPublicImage, uploadPublicVideo } from "@/lib/api/public/uploads";
import { useSellerEntitlements } from "@/hooks/useSellerEntitlements";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import * as categoriesApi from "@/lib/api/seller/categories";
import { UpgradeGate } from "@/components/seller/UpgradeGate";
import { Button } from "@/components/ui/Button";
import { FormSection } from "@/components/ui/FormSection";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";
import { resolveMediaUrl } from "@/lib/media";
import { formatMoneyInput, moneyInputToNumber, parseMoneyInput } from "@/lib/moneyInput";
import type {
  Product,
  ProductCreate,
  ProductFieldType,
  ProductFormFieldInput,
  ProductImageInput,
  ProductUpdate,
  ProductVariantInput,
} from "@/types/seller/product";

type ProductFormProps = {
  initial?: Product;
  /** Prefill gallery when creating (e.g. photo-first flow). Ignored if `initial` has images. */
  seedImages?: ProductImageInput[];
  onSubmit: (data: ProductCreate | ProductUpdate) => Promise<void>;
  submitLabel?: string;
};

type EditableImage = ProductImageInput & { clientKey: string };
type EditableField = ProductFormFieldInput & { clientKey: string; optionsText: string; validationText: string };
type EditableVariant = {
  clientKey: string;
  name: string;
  priceOverride: string;
  stockQuantity: string;
  isActive: boolean;
};

const FALLBACK_MAX_IMAGES = 8;
const MAX_VIDEO_BYTES = 52_428_800; // 50MB — must match MAX_VIDEO_UPLOAD_SIZE_BYTES in the backend

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
  DROPDOWN: "انتخاب از فهرست",
  RADIO: "انتخاب یکی از چند گزینه",
  CHECKBOX: "تیک بله/خیر",
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

function normalizeVariants(variants: Product["variants"]): EditableVariant[] {
  return (variants ?? []).map((variant, index) => ({
    clientKey: `${variant.id}-${index}`,
    name: variant.name,
    priceOverride: variant.price_override ? formatMoneyInput(variant.price_override) : "",
    stockQuantity: String(variant.stock_quantity),
    isActive: variant.is_active,
  }));
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

function emptyVariant(): EditableVariant {
  return {
    clientKey: crypto.randomUUID(),
    name: "",
    priceOverride: "",
    stockQuantity: "0",
    isActive: true,
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

function normalizeImageInputs(images: ProductImageInput[]): EditableImage[] {
  return images.map((image, index) => ({
    clientKey: crypto.randomUUID(),
    image_url: image.image_url,
    thumbnail_url: image.thumbnail_url ?? "",
    alt_text: image.alt_text ?? "",
    sort_order: image.sort_order ?? index,
    mime_type: image.mime_type ?? "",
    width: image.width ?? null,
    height: image.height ?? null,
  }));
}

export function ProductForm({
  initial,
  seedImages,
  onSubmit,
  submitLabel = "ذخیره محصول",
}: ProductFormProps) {
  const { entitlements } = useSellerEntitlements();
  const maxImages = entitlements.max_product_images || FALLBACK_MAX_IMAGES;
  const canVideo = entitlements.product_video;
  const canCustomFields = entitlements.custom_fields;
  const { data: categories } = useSellerFetch(() => categoriesApi.listCategories(), []);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(() => formatMoneyInput(initial?.price ?? ""));
  const [stock, setStock] = useState(String(initial?.stock_quantity ?? 0));
  const [categoryId, setCategoryId] = useState(initial?.category_id ? String(initial.category_id) : "");
  const [shippingCost, setShippingCost] = useState(() =>
    initial?.shipping_cost ? formatMoneyInput(initial.shipping_cost) : "",
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [images, setImages] = useState<EditableImage[]>(() => {
    if (initial && initial.images.length > 0) return normalizeImages(initial.images);
    if (seedImages && seedImages.length > 0) return normalizeImageInputs(seedImages);
    return [];
  });
  const [fields, setFields] = useState<EditableField[]>(
    initial ? normalizeFields(initial.form_fields) : [],
  );
  const [variants, setVariants] = useState<EditableVariant[]>(
    initial ? normalizeVariants(initial.variants) : [],
  );
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? "");
  const [videoMimeType, setVideoMimeType] = useState(initial?.video_mime_type ?? "");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const addImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setPrice(formatMoneyInput(initial?.price ?? ""));
    setStock(String(initial?.stock_quantity ?? 0));
    setCategoryId(initial?.category_id ? String(initial.category_id) : "");
    setShippingCost(initial?.shipping_cost ? formatMoneyInput(initial.shipping_cost) : "");
    setIsActive(initial?.is_active ?? true);
    setImages(initial && initial.images.length > 0 ? normalizeImages(initial.images) : []);
    setFields(initial ? normalizeFields(initial.form_fields) : []);
    setVariants(initial ? normalizeVariants(initial.variants) : []);
    setVideoUrl(initial?.video_url ?? "");
    setVideoMimeType(initial?.video_mime_type ?? "");
  }, [initial]);

  const hasPrimaryImage = useMemo(() => images.some((image) => image.image_url.trim()), [images]);

  function setImage(index: number, patch: Partial<EditableImage>) {
    setImages((prev) => prev.map((image, i) => (i === index ? { ...image, ...patch } : image)));
  }

  function setField(index: number, patch: Partial<EditableField>) {
    setFields((prev) => prev.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  }

  function setVariant(index: number, patch: Partial<EditableVariant>) {
    setVariants((prev) => prev.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)));
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
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
      setImageError(err instanceof ApiError ? err.message : "عکس بارگذاری نشد. دوباره امتحان کن.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleAddImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setImageError(null);
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setImageError(`حداکثر ${maxImages} عکس می‌تونی بذاری.`);
      event.target.value = "";
      return;
    }
    const toUpload = files.slice(0, remaining);
    try {
      const uploaded = await Promise.all(toUpload.map((file) => uploadImageFile(file)));
      setImages((prev) => [
        ...prev,
        ...uploaded.map((payload) => ({
          clientKey: crypto.randomUUID(),
          image_url: payload.image_url,
          thumbnail_url: payload.thumbnail_url,
          alt_text: payload.alt_text ?? "",
          sort_order: 0,
          mime_type: payload.mime_type,
          width: payload.width,
          height: payload.height,
        })),
      ]);
      if (files.length > remaining) {
        setImageError(`فقط ${remaining} تا عکس دیگه جا داشت و بقیه اضافه نشد.`);
      }
    } catch (err) {
      setImageError(err instanceof ApiError ? err.message : "عکس بارگذاری نشد. دوباره امتحان کن.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleVideoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setVideoError(null);
    if (file.size > MAX_VIDEO_BYTES) {
      setVideoError("حجم ویدیو باید ۵۰ مگابایت یا کمتر باشه.");
      event.target.value = "";
      return;
    }
    setVideoUploading(true);
    try {
      const uploaded = await uploadPublicVideo(file);
      setVideoUrl(uploaded.url);
      setVideoMimeType(uploaded.mime_type ?? "");
    } catch (err) {
      setVideoError(err instanceof ApiError ? err.message : "ویدیو بارگذاری نشد. دوباره امتحان کن.");
    } finally {
      setVideoUploading(false);
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
    const priceNum = moneyInputToNumber(price);
    const stockNum = parseInt(stock, 10);
    if (!title.trim()) {
      setError("عنوان محصول رو بنویس.");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError("قیمت باید بیشتر از صفر باشه.");
      return;
    }
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError("موجودی نمی‌تونه منفی باشه.");
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

    if (payloadImages.length > maxImages) {
      setError(`تو پلن فعلی حداکثر ${maxImages} عکس می‌تونی بذاری.`);
      return;
    }

    let payloadFields: ProductFormFieldInput[] = [];
    if (canCustomFields) {
      try {
        payloadFields = fields.map((field, index) => {
          const payload = toFormFieldInput({ ...field, sort_order: index });
          payload.sort_order = index;
          if (
            (payload.field_type === "DROPDOWN" || payload.field_type === "RADIO") &&
            (!payload.options || payload.options.length === 0)
          ) {
            throw new Error(`برای «${payload.label}» گزینه‌ها رو بنویس`);
          }
          if (!payload.field_key || !payload.label) {
            throw new Error("هر سؤال سفارشی باید عنوان داشته باشه.");
          }
          return payload;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "یکی از سؤال‌های سفارشی درست تنظیم نشده.");
        return;
      }
    }

    let payloadVariants: ProductVariantInput[];
    try {
      payloadVariants = variants.map((variant, index) => {
        const name = variant.name.trim();
        if (!name) {
          throw new Error("برای هر تنوع یه اسم بنویس؛ مثلاً «سایز L».");
        }
        const overrideText = variant.priceOverride.trim();
        let priceOverride: number | null = null;
        if (overrideText) {
          const parsed = moneyInputToNumber(overrideText);
          if (Number.isNaN(parsed) || parsed <= 0) {
            throw new Error(`قیمت «${name}» باید بیشتر از صفر باشه.`);
          }
          priceOverride = parsed;
        }
        const stockParsed = parseInt(variant.stockQuantity, 10);
        if (Number.isNaN(stockParsed) || stockParsed < 0) {
          throw new Error(`موجودی «${name}» نمی‌تونه منفی باشه.`);
        }
        return {
          name,
          price_override: priceOverride,
          stock_quantity: stockParsed,
          sort_order: index,
          is_active: variant.isActive,
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "یکی از تنوع‌ها درست تنظیم نشده.");
      return;
    }

    setLoading(true);
    try {
      const shippingText = parseMoneyInput(shippingCost);
      let parsedShipping: number | null = null;
      if (shippingText) {
        parsedShipping = moneyInputToNumber(shippingCost);
        if (Number.isNaN(parsedShipping) || parsedShipping < 0) {
          setError("هزینه ارسال نمی‌تونه منفی باشه.");
          setLoading(false);
          return;
        }
      }

      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        price: priceNum,
        stock_quantity: stockNum,
        is_active: isActive,
        category_id: categoryId ? parseInt(categoryId, 10) : null,
        shipping_cost: parsedShipping,
        video_url: canVideo ? videoUrl.trim() || null : null,
        video_mime_type: canVideo && videoUrl.trim() ? videoMimeType.trim() || null : null,
        images: payloadImages.length > 0 ? payloadImages : null,
        form_fields: canCustomFields && payloadFields.length > 0 ? payloadFields : null,
        variants: payloadVariants.length > 0 ? payloadVariants : null,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "محصول ذخیره نشد. دوباره امتحان کن.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:space-y-5 sm:pb-6">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10" role="alert">
          {error}
        </p>
      ) : null}
      {imageError ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" role="alert">
          {imageError}
        </p>
      ) : null}

      <FormSection title="اطلاعات اصلی" description="چی مشتری تو فروشگاه می‌بینه.">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="sm:col-span-2">
            <Input
              label="عنوان محصول"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="توضیحات"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <MoneyInput label="قیمت" value={price} onValueChange={setPrice} required />
          <Input
            label="موجودی"
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
          />
          <Select label="دسته‌بندی" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">بدون دسته‌بندی</option>
            {(categories ?? []).map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </Select>
          <MoneyInput
            label="هزینه ارسال این محصول"
            value={shippingCost}
            onValueChange={setShippingCost}
            hint="اگر خالی بمونه، هزینه ارسال پیش‌فرض فروشگاه حساب می‌شه."
          />
          <label htmlFor="product-is-active" className="flex items-center gap-2 text-sm text-foreground sm:col-span-2">
            <input
              id="product-is-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-border"
            />
            محصول تو فروشگاه نشون داده بشه
          </label>
        </div>
      </FormSection>

      <FormSection
        title="عکس‌ها"
        description={`عکس اول، عکس اصلی محصول می‌شه. حداکثر ${maxImages} عکس.`}
        action={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={images.length >= maxImages}
            onClick={() => addImageInputRef.current?.click()}
          >
            افزودن عکس
          </Button>
        }
      >
        <input
          ref={addImageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => void handleAddImages(event)}
        />
        {images.length === 0 ? (
          <button
            type="button"
            onClick={() => addImageInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-10 text-sm text-foreground-muted transition hover:border-brand/40 hover:text-foreground"
          >
            <span className="font-medium text-foreground">بارگذاری عکس</span>
            <span className="text-xs">برای نمایش تو فروشگاه دست‌کم یه عکس لازم است</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image, index) => (
              <div
                key={image.clientKey}
                className={cn(
                  "overflow-hidden rounded-xl border bg-surface",
                  index === 0 ? "border-brand ring-1 ring-brand/30" : "border-border",
                )}
              >
                <div className="relative aspect-square bg-surface-muted">
                  {image.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(image.thumbnail_url || image.image_url) || image.thumbnail_url || image.image_url}
                      alt={image.alt_text || title || "تصویر محصول"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-foreground-muted">بدون تصویر</div>
                  )}
                  {index === 0 ? (
                    <span className="absolute start-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-medium text-white">
                      اصلی
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2 p-2">
                  <Input
                    label="متن جایگزین"
                    value={image.alt_text ?? ""}
                    onChange={(e) => setImage(index, { alt_text: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-1">
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
                      size="sm"
                      className="flex-1"
                      onClick={() => fileInputs.current[image.clientKey]?.click()}
                    >
                      تعویض
                    </Button>
                    {index > 0 ? (
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
                      >
                        اصلی
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 dark:text-red-400"
                      onClick={() => removeImage(index)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!hasPrimaryImage ? (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">تا یه عکس اضافه نکنی، محصول تو فروشگاه دیده نمی‌شه.</p>
        ) : null}
      </FormSection>

      <FormSection
        title="ویدیو (اختیاری)"
        description={canVideo ? "فایل MP4 یا WebM، تا ۵۰ مگابایت." : "از پلن حرفه‌ای به بالا فعاله."}
        action={
          canVideo ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={videoUploading}
                onClick={() => videoInputRef.current?.click()}
              >
                {videoUrl.trim() ? "تعویض ویدیو" : "بارگذاری ویدیو"}
              </Button>
              {videoUrl.trim() ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 dark:text-red-400"
                  onClick={() => {
                    setVideoUrl("");
                    setVideoMimeType("");
                    setVideoError(null);
                  }}
                >
                  حذف
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      >
        {!canVideo ? (
          <UpgradeGate
            compact
            title="ویدیو محصول در پلن حرفه‌ای فعال است"
            description="با ویدیو، خریدار محصول رو بهتر می‌بینه و احتمال خرید بالاتر می‌ره."
            ctaLabel="ارتقا به حرفه‌ای"
          />
        ) : (
          <>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={(event) => void handleVideoChange(event)}
            />
            {videoError ? (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" role="alert">
                {videoError}
              </p>
            ) : null}
            {videoUrl.trim() ? (
              <video
                src={videoUrl}
                controls
                preload="metadata"
                className="max-h-64 w-full rounded-xl bg-black object-contain"
              />
            ) : (
              <p className="text-sm text-foreground-muted">هنوز ویدیویی نذاشتی.</p>
            )}
          </>
        )}
      </FormSection>

      <FormSection
        title="تنوع‌ها (اختیاری)"
        description="مثل سایز یا رنگ. اگر قیمت تنوعی رو خالی بذاری، قیمت اصلی محصول حساب می‌شه."
        action={
          <Button type="button" variant="secondary" size="sm" onClick={() => setVariants((prev) => [...prev, emptyVariant()])}>
            افزودن
          </Button>
        }
      >
        {variants.length === 0 ? (
          <p className="text-sm text-foreground-muted">تنوعی نداره؛ محصول با یه قیمت و یه موجودی فروخته می‌شه.</p>
        ) : (
          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div key={variant.clientKey} className="space-y-3 rounded-xl border border-border p-3 sm:p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    label="نام"
                    value={variant.name}
                    onChange={(e) => setVariant(index, { name: e.target.value })}
                    placeholder="مثلاً سایز L"
                  />
                  <MoneyInput
                    label="قیمت (اختیاری)"
                    value={variant.priceOverride}
                    onValueChange={(next) => setVariant(index, { priceOverride: next })}
                    placeholder="خالی بمونه یعنی قیمت اصلی"
                  />
                  <Input
                    label="موجودی"
                    type="number"
                    min="0"
                    value={variant.stockQuantity}
                    onChange={(e) => setVariant(index, { stockQuantity: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor={`variant-active-${variant.clientKey}`} className="me-auto flex items-center gap-2 text-sm text-foreground">
                    <input
                      id={`variant-active-${variant.clientKey}`}
                      type="checkbox"
                      checked={variant.isActive}
                      onChange={(e) => setVariant(index, { isActive: e.target.checked })}
                    />
                    فعال
                  </label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setVariants((prev) => moveItem(prev, index, -1))} disabled={index === 0}>
                    بالا
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setVariants((prev) => moveItem(prev, index, 1))} disabled={index === variants.length - 1}>
                    پایین
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 dark:text-red-400"
                    onClick={() => removeVariant(index)}
                  >
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </FormSection>

      <FormSection
        title="سؤال‌های سفارشی (اختیاری)"
        description={
          canCustomFields
            ? "سؤال‌هایی که مشتری موقع خرید جواب می‌ده؛ مثلاً متن حک روی محصول."
            : "از پلن حرفه‌ای به بالا فعاله."
        }
        action={
          canCustomFields ? (
            <Button type="button" variant="secondary" size="sm" onClick={() => setFields((prev) => [...prev, emptyField()])}>
              افزودن
            </Button>
          ) : undefined
        }
      >
        {!canCustomFields ? (
          <UpgradeGate
            compact
            title="سؤال‌های سفارشی از پلن پایه به بالا"
            description="مثلاً سایز، رنگ یا متن حکاکی رو موقع خرید از مشتری بپرس."
            ctaLabel="ارتقا به پایه"
          />
        ) : fields.length === 0 ? (
          <p className="text-sm text-foreground-muted">سؤال سفارشی نداره.</p>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.clientKey} className="space-y-3 rounded-xl border border-border p-3 sm:p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="برچسب"
                    value={field.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      const key =
                        field.field_key.trim() ||
                        label
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, "_")
                          .replace(/[^\w\u0600-\u06FF-]/g, "") ||
                        `field_${index + 1}`;
                      setField(index, {
                        label,
                        field_key: field.field_key.trim() ? field.field_key : key,
                      });
                    }}
                  />
                  <label className="space-y-1.5 text-sm text-foreground">
                    <span className="block font-medium">نوع</span>
                    <select
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2"
                      value={field.field_type}
                      onChange={(e) => {
                        const nextType = e.target.value as ProductFieldType;
                        setField(index, {
                          field_type: nextType,
                          optionsText:
                            nextType === "DROPDOWN" || nextType === "RADIO" ? field.optionsText : "",
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
                    label="کلید فیلد"
                    value={field.field_key}
                    onChange={(e) => setField(index, { field_key: e.target.value })}
                    hint="شناسه داخلی؛ معمولاً خودکار پر می‌شه"
                  />
                  <Input
                    label="متن راهنما"
                    value={field.placeholder ?? ""}
                    onChange={(e) => setField(index, { placeholder: e.target.value })}
                  />
                  {(field.field_type === "DROPDOWN" || field.field_type === "RADIO") && (
                    <Textarea
                      label="گزینه‌ها"
                      hint="هر گزینه در یک خط، به شکل برچسب|مقدار"
                      value={field.optionsText}
                      onChange={(e) => setField(index, { optionsText: e.target.value })}
                      rows={3}
                      className="sm:col-span-2"
                    />
                  )}
                  <details className="sm:col-span-2">
                    <summary className="cursor-pointer text-xs text-foreground-muted">تنظیمات پیشرفته</summary>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <Input
                        label="توضیح کمکی"
                        value={field.help_text ?? ""}
                        onChange={(e) => setField(index, { help_text: e.target.value })}
                      />
                      <Textarea
                        label="قوانین اعتبارسنجی (JSON)"
                        hint='نمونه: {"min": 1, "max": 10}'
                        value={field.validationText}
                        onChange={(e) => setField(index, { validationText: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </details>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor={`field-required-${field.clientKey}`} className="me-auto flex items-center gap-2 text-sm text-foreground">
                    <input
                      id={`field-required-${field.clientKey}`}
                      type="checkbox"
                      checked={field.is_required}
                      onChange={(e) => setField(index, { is_required: e.target.checked })}
                    />
                    ضروری
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
                    className="text-red-600 dark:text-red-400"
                    onClick={() => removeField(index)}
                  >
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </FormSection>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface/95 p-3 backdrop-blur sm:static sm:bottom-auto sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none lg:bottom-0">
        <div className="mx-auto flex max-w-5xl gap-2 sm:justify-end">
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
