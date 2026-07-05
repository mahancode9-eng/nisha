"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { uploadPublicImage } from "@/lib/api/public/uploads";
import { resolveMediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormSection } from "@/components/ui/FormSection";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  SOCIAL_PLATFORM_OPTIONS,
  SocialIcon,
  type SocialPlatformKey,
  getSocialPlatformLabel,
} from "@/components/ui/SocialIcon";
import type { Store, StoreUpdate } from "@/types/seller/store";

type EditableSocialLink = {
  platform: SocialPlatformKey;
  customLabel: string;
  url: string;
  is_active: boolean;
};

type StoreOnboardingWizardProps = {
  store: Store;
  onSave: (data: StoreUpdate) => Promise<void>;
  onFinish: () => void;
};

function blankLink(): EditableSocialLink {
  return {
    platform: "telegram",
    customLabel: "",
    url: "",
    is_active: true,
  };
}

function normalizePlatform(iconKey: string | null | undefined, label: string): SocialPlatformKey {
  const normalized = (iconKey ?? label).toLowerCase();
  if (normalized.includes("telegram")) return "telegram";
  if (normalized.includes("whatsapp")) return "whatsapp";
  if (normalized.includes("instagram")) return "instagram";
  if (normalized.includes("discord")) return "discord";
  if (normalized.includes("twitter") || normalized.includes("x")) return "x";
  if (normalized.includes("web")) return "website";
  return "other";
}

function mapLabel(platform: SocialPlatformKey, customLabel: string): string {
  return platform === "other" ? customLabel.trim() || "دیگر" : getSocialPlatformLabel(platform);
}

function fileToDataUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function StoreOnboardingWizard({ store, onSave, onFinish }: StoreOnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description ?? "");
  const [location, setLocation] = useState(store.location ?? "");
  const [logoUrl, setLogoUrl] = useState(store.logo_url ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(store.cover_image_url ?? "");
  const [logoPreview, setLogoPreview] = useState<string | null>(store.logo_url ? resolveMediaUrl(store.logo_url) : null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    store.cover_image_url ? resolveMediaUrl(store.cover_image_url) : null,
  );
  const [socialLinks, setSocialLinks] = useState<EditableSocialLink[]>(
    store.social_links.length > 0
      ? store.social_links.map((link) => {
          const platform = normalizePlatform(link.icon_key, link.label);
          return {
            platform,
            customLabel: platform === "other" ? link.label : "",
            url: link.url,
            is_active: link.is_active,
          };
        })
      : [],
  );
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(
    () => () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    },
    [logoPreview, coverPreview],
  );

  function updateLink(index: number, patch: Partial<EditableSocialLink>) {
    setSocialLinks((prev) => prev.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = await fileToDataUrl(file);
    if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoPreview(preview);
    try {
      const uploaded = await uploadPublicImage(file);
      setLogoUrl(uploaded.url);
    } catch {
      setLogoPreview(null);
    }
    event.target.value = "";
  }

  async function handleCoverUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = await fileToDataUrl(file);
    if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    setCoverPreview(preview);
    try {
      const uploaded = await uploadPublicImage(file);
      setCoverImageUrl(uploaded.url);
    } catch {
      setCoverPreview(null);
    }
    event.target.value = "";
  }

  async function savePatch(patch: StoreUpdate) {
    setSaving(true);
    try {
      await onSave(patch);
    } finally {
      setSaving(false);
    }
  }

  async function continueStep() {
    if (step === 0) {
      await savePatch({ logo_url: logoUrl.trim() || null });
    } else if (step === 1) {
      await savePatch({ name: name.trim() });
    } else if (step === 2) {
      await savePatch({ description: description.trim() || null });
    } else if (step === 3) {
      await savePatch({
        social_links: socialLinks.map((link, index) => ({
          label: mapLabel(link.platform, link.customLabel),
          url: link.url.trim(),
          icon_key: link.platform,
          sort_order: index,
          is_active: link.is_active,
        })),
      });
    } else if (step === 4) {
      await savePatch({ location: location.trim() || null });
    } else if (step === 5) {
      await savePatch({ cover_image_url: coverImageUrl.trim() || null });
      onFinish();
      return;
    }

    setStep((current) => Math.min(current + 1, 5));
  }

  const totalSteps = 6;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-5 py-6">
          <div className="space-y-2">
            <p className="text-xs tracking-[0.24em] text-foreground-muted">آغاز به کار فروشنده</p>
            <h1 className="text-2xl font-semibold text-foreground">فروشگاه خود را راه‌اندازی کنید</h1>
            <p className="text-sm text-foreground-muted">
              موارد ضروری را همین حالا تکمیل کنید. می‌توانید مراحل اختیاری را رد کنید و بعدا برگردید.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-6">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full ${index <= step ? "bg-brand" : "bg-border"}`}
              />
            ))}
          </div>

          {step === 0 && (
            <FormSection
              title="مرحله ۱"
              description="ابتدا لوگوی خود را بارگذاری کنید. این شناخته‌شده‌ترین دارایی برند شماست."
            >
              <div className="space-y-3">
                <div className="overflow-hidden rounded-3xl border border-dashed border-border bg-surface-muted">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="پیش‌نمایش لوگو" className="h-48 w-full object-cover" />
                  ) : (
                    <div className="flex h-48 items-center justify-center text-sm text-foreground-muted">
                      هنوز لوگویی بارگذاری نشده است
                    </div>
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => logoInputRef.current?.click()} loading={saving}>
                    بارگذاری لوگو
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    رد کردن
                  </Button>
                </div>
              </div>
            </FormSection>
          )}

          {step === 1 && (
            <FormSection title="مرحله ۲" description="برای فروشگاه یک نام روشن و واضح انتخاب کنید.">
              <div className="space-y-4">
                <Input label="نام فروشگاه" value={name} onChange={(e) => setName(e.target.value)} required />
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                    بازگشت
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                    رد کردن
                  </Button>
                </div>
              </div>
            </FormSection>
          )}

          {step === 2 && (
            <FormSection title="مرحله ۳" description="یک توضیح کوتاه برای صفحه عمومی فروشگاه اضافه کنید.">
              <div className="space-y-4">
                <Textarea label="توضیحات" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    بازگشت
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                    رد کردن
                  </Button>
                </div>
              </div>
            </FormSection>
          )}

          {step === 3 && (
            <FormSection
              title="مرحله ۴"
              description="لینک‌های اجتماعی اضافه کنید. پلتفرم انتخابی آیکن عمومی را تعیین می‌کند."
              action={
                <Button type="button" variant="secondary" size="sm" onClick={() => setSocialLinks((prev) => [...prev, blankLink()])}>
                  افزودن لینک
                </Button>
              }
            >
              <div className="space-y-3">
                {socialLinks.length === 0 ? (
                  <EmptyState
                    title="لینک اجتماعی ندارید"
                    description="تلگرام، واتساپ، اینستاگرام، دیسکورد، ایکس/توییتر، وب‌سایت یا سایر لینک‌ها."
                  />
                ) : (
                  socialLinks.map((link, index) => (
                    <div key={`${index}-${link.platform}`} className="rounded-3xl border border-border p-4">
                      <div className="flex items-start gap-3">
                        <SocialIcon platform={link.platform} />
                        <div className="min-w-0 flex-1 space-y-3">
                          <Select
                            label="پلتفرم"
                            value={link.platform}
                            onChange={(e) => updateLink(index, { platform: e.target.value as SocialPlatformKey })}
                          >
                            {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                          {link.platform === "other" && (
                            <Input
                              label="برچسب"
                              value={link.customLabel}
                              onChange={(e) => updateLink(index, { customLabel: e.target.value })}
                              hint="وقتی پلتفرم «دیگر» است در صفحه عمومی نمایش داده می‌شود"
                            />
                          )}
                          <Input label="نشانی" type="url" value={link.url} onChange={(e) => updateLink(index, { url: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                    بازگشت
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep(4)}>
                    رد کردن
                  </Button>
                </div>
              </div>
            </FormSection>
          )}

          {step === 4 && (
            <FormSection title="مرحله ۵" description="موقعیت اختیاری است، اما به اعتماد مشتریان کمک می‌کند.">
              <div className="space-y-4">
                <Input label="موقعیت" value={location} onChange={(e) => setLocation(e.target.value)} />
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                    بازگشت
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep(5)}>
                    رد کردن
                  </Button>
                </div>
              </div>
            </FormSection>
          )}

          {step === 5 && (
            <FormSection
              title="مرحله ۶"
              description="یک تصویر روی جلد برای سربرگ عمومی فروشگاه بارگذاری کنید. این مرحله اختیاری است."
            >
              <div className="space-y-3">
                <div className="overflow-hidden rounded-3xl border border-dashed border-border bg-surface-muted">
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="پیش‌نمایش تصویر روی جلد" className="h-48 w-full object-cover" />
                  ) : (
                    <div className="flex h-48 items-center justify-center text-sm text-foreground-muted">
                      هنوز تصویری برای جلد بارگذاری نشده است
                    </div>
                  )}
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => coverInputRef.current?.click()} loading={saving}>
                    بارگذاری تصویر روی جلد
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => onFinish()}>
                    تکمیل بعدا
                  </Button>
                </div>
              </div>
            </FormSection>
          )}

          <div className="flex flex-wrap justify-between gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
              بازگشت
            </Button>
            <Button type="button" onClick={() => void continueStep()} loading={saving} disabled={saving}>
              {step === 5 ? "پایان راه‌اندازی" : "ذخیره و ادامه"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
