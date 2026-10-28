"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api/errors";
import { uploadPublicImage } from "@/lib/api/public/uploads";
import * as categoriesApi from "@/lib/api/seller/categories";
import { paths } from "@/lib/auth/paths";
import { useSellerEntitlements } from "@/hooks/useSellerEntitlements";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { resolveMediaUrl } from "@/lib/media";
import { formatMoney } from "@/lib/format";
import { moneyInputToNumber, parseMoneyInput } from "@/lib/moneyInput";
import type { Product, ProductCreate, ProductImageInput } from "@/types/seller/product";

type Step = "photos" | "details" | "review";

const STEPS: Step[] = ["photos", "details", "review"];
const STEP_LABELS: Record<Step, string> = {
  photos: "عکس",
  details: "جزئیات",
  review: "انتشار",
};

const FALLBACK_MAX_IMAGES = 8;

type DraftImage = ProductImageInput & { clientKey: string; previewUrl?: string };

type NewProductComposerProps = {
  onPublish: (data: ProductCreate, mode: "list" | "edit") => Promise<Product | void>;
};

export function NewProductComposer({ onPublish }: NewProductComposerProps) {
  const { entitlements } = useSellerEntitlements();
  const maxImages = entitlements.max_product_images || FALLBACK_MAX_IMAGES;
  const { data: categories } = useSellerFetch(() => categoriesApi.listCategories(), []);

  const [step, setStep] = useState<Step>("photos");
  const [images, setImages] = useState<DraftImage[]>([]);
  const [skippedPhotos, setSkippedPhotos] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stepIndex = STEPS.indexOf(step);
  const cover = images[0] ?? null;
  const coverSrc = cover
    ? cover.previewUrl ||
      resolveMediaUrl(cover.thumbnail_url || cover.image_url) ||
      cover.image_url
    : null;

  const categoryName = useMemo(() => {
    if (!categoryId) return null;
    return (categories ?? []).find((c) => String(c.id) === categoryId)?.name ?? null;
  }, [categories, categoryId]);

  function openGallery() {
    fileInputRef.current?.click();
  }

  async function handlePickFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setError(null);
    setSkippedPhotos(false);

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setError(`حداکثر ${maxImages} عکس می‌تونی بذاری.`);
      event.target.value = "";
      return;
    }

    const toUpload = files.slice(0, remaining);
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        toUpload.map(async (file) => {
          const result = await uploadPublicImage(file);
          return {
            clientKey: crypto.randomUUID(),
            image_url: result.url,
            thumbnail_url: result.thumbnail_url,
            mime_type: result.mime_type,
            width: result.width,
            height: result.height,
            alt_text: file.name.replace(/\.[^.]+$/, ""),
            previewUrl: URL.createObjectURL(file),
          } satisfies DraftImage;
        }),
      );
      setImages((prev) => [...prev, ...uploaded]);
      if (files.length > remaining) {
        setError(`فقط ${remaining} تا عکس دیگه جا داشت.`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "عکس بارگذاری نشد. دوباره امتحان کن.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  }

  function makeCover(index: number) {
    if (index <= 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [selected] = next.splice(index, 1);
      next.unshift(selected);
      return next;
    });
  }

  function goBack() {
    setError(null);
    if (stepIndex <= 0) return;
    setStep(STEPS[stepIndex - 1]!);
  }

  function validateDetails(): string | null {
    if (!title.trim()) return "عنوان محصول رو بنویس.";
    const priceNum = moneyInputToNumber(price);
    if (!parseMoneyInput(price) || Number.isNaN(priceNum) || priceNum <= 0) {
      return "قیمت باید بیشتر از صفر باشه.";
    }
    const stockNum = parseInt(stock, 10);
    if (Number.isNaN(stockNum) || stockNum < 0) return "موجودی نمی‌تونه منفی باشه.";
    return null;
  }

  function goNext() {
    setError(null);
    if (step === "photos") {
      if (images.length === 0 && !skippedPhotos) {
        setError("دست‌کم یه عکس انتخاب کن یا بدون عکس ادامه بده.");
        return;
      }
      setStep("details");
      return;
    }
    if (step === "details") {
      const msg = validateDetails();
      if (msg) {
        setError(msg);
        return;
      }
      setStep("review");
    }
  }

  function skipPhotos() {
    setSkippedPhotos(true);
    setError(null);
    setStep("details");
  }

  function buildPayload(): ProductCreate {
    const payloadImages = images.map((image, index) => ({
      image_url: image.image_url,
      thumbnail_url: image.thumbnail_url ?? null,
      alt_text: image.alt_text ?? null,
      sort_order: index,
      mime_type: image.mime_type ?? null,
      width: image.width ?? null,
      height: image.height ?? null,
    }));

    return {
      title: title.trim(),
      price: moneyInputToNumber(price),
      stock_quantity: parseInt(stock, 10) || 0,
      is_active: true,
      category_id: categoryId ? parseInt(categoryId, 10) : null,
      images: payloadImages.length > 0 ? payloadImages : null,
    };
  }

  async function publish(mode: "list" | "edit") {
    const msg = validateDetails();
    if (msg) {
      setError(msg);
      setStep("details");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      await onPublish(buildPayload(), mode);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "محصول منتشر نشد. دوباره امتحان کن.");
    } finally {
      setPublishing(false);
    }
  }

  const primaryLabel =
    step === "review" ? "انتشار محصول" : step === "details" ? "مرور نهایی" : "ادامه";

  return (
    <div className="mx-auto w-full max-w-xl">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => void handlePickFiles(event)}
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-3 py-3 sm:px-5">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="shrink-0 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground-muted transition hover:bg-surface-muted hover:text-foreground"
            >
              بازگشت
            </button>
          ) : (
            <Link
              href={paths.seller.products}
              className="shrink-0 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground-muted transition hover:bg-surface-muted hover:text-foreground"
            >
              انصراف
            </Link>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-foreground">محصول جدید</p>
              <p className="shrink-0 text-xs text-foreground-muted">
                {stepIndex + 1}/{STEPS.length} · {STEP_LABELS[step]}
              </p>
            </div>
            <div className="flex gap-1" aria-label="مراحل">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= stepIndex ? "bg-brand" : "bg-border",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 px-3 py-4 sm:px-5 sm:py-5">
          {error ? (
            <p
              className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {step === "photos" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground sm:text-lg">عکس محصول</h2>
                <p className="mt-0.5 text-sm text-foreground-muted">
                  عکس اول، عکس اصلی محصول می‌شه. اگر داری، چند تا عکس از زاویه‌های مختلف بذار.
                </p>
              </div>

              {images.length === 0 ? (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={openGallery}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-12 text-center transition hover:border-brand/40 sm:py-14"
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-2xl font-light text-brand"
                    aria-hidden
                  >
                    +
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {uploading ? "داره بارگذاری می‌شه…" : "انتخاب از گالری"}
                  </span>
                  <span className="text-xs text-foreground-muted">می‌تونی چند تا عکس رو با هم انتخاب کنی</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative mx-auto aspect-square w-full max-h-[min(52vh,28rem)] overflow-hidden rounded-xl bg-surface-muted">
                    {coverSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverSrc} alt="" className="h-full w-full object-cover" />
                    ) : null}
                    <span className="absolute start-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                      کاور
                    </span>
                  </div>

                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {images.map((image, index) => {
                      const src =
                        image.previewUrl ||
                        resolveMediaUrl(image.thumbnail_url || image.image_url) ||
                        image.image_url;
                      return (
                        <div
                          key={image.clientKey}
                          className={cn(
                            "relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg border-2",
                            index === 0 ? "border-brand" : "border-border",
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="h-full w-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-0.5 bg-black/55 px-1 py-0.5">
                            {index > 0 ? (
                              <button
                                type="button"
                                className="text-[10px] text-white"
                                onClick={() => makeCover(index)}
                              >
                                کاور
                              </button>
                            ) : (
                              <span className="text-[10px] text-white/80">اصلی</span>
                            )}
                            <button
                              type="button"
                              className="text-[10px] text-white"
                              onClick={() => removeImage(index)}
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {images.length < maxImages ? (
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={openGallery}
                        className="flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-border text-foreground-muted hover:border-brand/40 hover:text-foreground"
                      >
                        <span className="text-lg leading-none">+</span>
                        <span className="text-[10px]">{uploading ? "…" : "بیشتر"}</span>
                      </button>
                    ) : null}
                  </div>

                  <p className="text-center text-xs text-foreground-muted">
                    {images.length} از {maxImages} عکس
                  </p>
                </div>
              )}

              {images.length === 0 ? (
                <button
                  type="button"
                  className="w-full text-center text-sm text-foreground-muted underline-offset-2 hover:text-foreground hover:underline"
                  onClick={skipPhotos}
                >
                  فعلاً بدون عکس ادامه می‌دی؟
                </button>
              ) : null}
            </div>
          ) : null}

          {step === "details" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground sm:text-lg">جزئیات کوتاه</h2>
                <p className="mt-0.5 text-sm text-foreground-muted">عنوان، قیمت و موجودی.</p>
              </div>

              {coverSrc ? (
                <div className="flex items-center gap-3 rounded-xl bg-surface-muted/50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverSrc} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <p className="text-xs text-foreground-muted">{images.length} عکس آماده است</p>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-foreground-muted">
                  بدون عکس؛ بعداً از صفحه ویرایش اضافه کن.
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    label="عنوان محصول"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثلاً کیف چرمی دستی"
                    required
                  />
                </div>
                <MoneyInput label="قیمت" value={price} onValueChange={setPrice} required />
                <Input
                  label="موجودی"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
                <div className="sm:col-span-2">
                  <Select
                    label="دسته‌بندی (اختیاری)"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">بدون دسته‌بندی</option>
                    {(categories ?? []).map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          ) : null}

          {step === "review" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground sm:text-lg">آماده‌ای منتشر کنی؟</h2>
                <p className="mt-0.5 text-sm text-foreground-muted">یه بار مرور کن و منتشر کن.</p>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <div className="aspect-[16/10] bg-surface-muted sm:aspect-[2/1]">
                  {coverSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
                      بدون تصویر
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{title.trim() || "بدون عنوان"}</p>
                    <p className="mt-1 text-base font-medium text-brand">
                      {parseMoneyInput(price) ? formatMoney(moneyInputToNumber(price)) : "—"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                    <div>
                      <p className="text-xs text-foreground-muted">موجودی</p>
                      <p className="font-medium text-foreground">{stock || "0"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted">دسته‌بندی</p>
                      <p className="font-medium text-foreground">{categoryName ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-full text-center text-sm text-foreground-muted underline-offset-2 hover:text-foreground hover:underline"
                disabled={publishing}
                onClick={() => void publish("edit")}
              >
                انتشار و ویرایش بیشتر
              </button>
            </div>
          ) : null}
        </div>

        {/* Footer CTA — in-flow, no fixed overlay fighting the mobile dock */}
        <div className="border-t border-border bg-surface px-3 py-3 sm:px-5">
          {step === "review" ? (
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" disabled={publishing} onClick={goBack}>
                ویرایش
              </Button>
              <Button
                type="button"
                className="min-w-0 flex-[1.35]"
                loading={publishing}
                onClick={() => void publish("list")}
              >
                انتشار محصول
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              className="w-full"
              disabled={uploading || (step === "photos" && images.length === 0)}
              onClick={goNext}
            >
              {primaryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
