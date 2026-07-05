"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError } from "@/lib/api/errors";
import { uploadPublicImage } from "@/lib/api/public/uploads";
import { resolveMediaUrl } from "@/lib/media";
import { SELLER_STORE_CATEGORY_OPTIONS } from "@/lib/seller/storeCategories";
import { Button } from "@/components/ui/Button";
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

type StoreSettingsFormProps = {
  store: Store;
  onSubmit: (data: StoreUpdate) => Promise<void>;
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
  if (normalized.includes("email") || normalized.includes("mail")) return "email";
  if (normalized.includes("telegram")) return "telegram";
  if (normalized.includes("whatsapp")) return "whatsapp";
  if (normalized.includes("instagram")) return "instagram";
  if (normalized.includes("discord")) return "discord";
  if (normalized.includes("twitter") || normalized.includes("x")) return "x";
  if (normalized.includes("web")) return "website";
  return "other";
}

function makeSocialLinkLabel(platform: SocialPlatformKey, customLabel: string): string {
  return platform === "other" ? customLabel.trim() || "دیگر" : getSocialPlatformLabel(platform);
}

export function StoreSettingsForm({ store, onSubmit }: StoreSettingsFormProps) {
  const [name, setName] = useState(store.name);
  const [slug, setSlug] = useState(store.slug);
  const [description, setDescription] = useState(store.description ?? "");
  const [logoUrl, setLogoUrl] = useState(store.logo_url ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(store.cover_image_url ?? "");
  const [categorySlug, setCategorySlug] = useState(store.category_slug ?? "");
  const [categoryName, setCategoryName] = useState(store.category_name ?? "");
  const [location, setLocation] = useState(store.location ?? "");
  const [phone, setPhone] = useState(store.phone ?? "");
  const [telegram, setTelegram] = useState(store.telegram ?? "");
  const [whatsapp, setWhatsapp] = useState(store.whatsapp ?? "");
  const [instagram, setInstagram] = useState(store.instagram ?? "");
  const [bale, setBale] = useState(store.bale ?? "");
  const [website, setWebsite] = useState(store.website ?? "");
  const [supportContact, setSupportContact] = useState(store.support_contact ?? "");
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
  const [isActive, setIsActive] = useState(store.is_active);
  const [logoPreview, setLogoPreview] = useState<string | null>(store.logo_url ? resolveMediaUrl(store.logo_url) : null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    store.cover_image_url ? resolveMediaUrl(store.cover_image_url) : null,
  );
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(store.name);
    setSlug(store.slug);
    setDescription(store.description ?? "");
    setLogoUrl(store.logo_url ?? "");
    setCoverImageUrl(store.cover_image_url ?? "");
    setCategorySlug(store.category_slug ?? "");
    setCategoryName(store.category_name ?? "");
    setLocation(store.location ?? "");
    setPhone(store.phone ?? "");
    setTelegram(store.telegram ?? "");
    setWhatsapp(store.whatsapp ?? "");
    setInstagram(store.instagram ?? "");
    setBale(store.bale ?? "");
    setWebsite(store.website ?? "");
    setSupportContact(store.support_contact ?? "");
    setSocialLinks(
      store.social_links.map((link) => {
        const platform = normalizePlatform(link.icon_key, link.label);
        return {
          platform,
          customLabel: platform === "other" ? link.label : "",
          url: link.url,
          is_active: link.is_active,
        };
      }),
    );
    setIsActive(store.is_active);
    setLogoPreview(store.logo_url ? resolveMediaUrl(store.logo_url) : null);
    setCoverPreview(store.cover_image_url ? resolveMediaUrl(store.cover_image_url) : null);
  }, [store]);

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

  function moveLink(index: number, delta: number) {
    setSocialLinks((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setError(null);
    try {
      const uploaded = await uploadPublicImage(file);
      setLogoUrl(uploaded.url);
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      setLogoPreview(uploaded.thumbnail_url ?? uploaded.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "بارگذاری لوگو ناموفق بود");
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  }

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    setError(null);
    try {
      const uploaded = await uploadPublicImage(file);
      setCoverImageUrl(uploaded.url);
      if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
      setCoverPreview(uploaded.thumbnail_url ?? uploaded.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "بارگذاری تصویر روی جلد ناموفق بود");
    } finally {
      setCoverUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !slug.trim()) {
      setError("نام فروشگاه و اسلاگ الزامی هستند.");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError("اسلاگ باید با حروف کوچک، اعداد و خط تیره باشد.");
      return;
    }

    setLoading(true);
    try {
      const normalizedCategorySlug = categorySlug.trim();
      await onSubmit({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        logo_url: logoUrl.trim() || null,
        cover_image_url: coverImageUrl.trim() || null,
        category_slug: normalizedCategorySlug || null,
        category_name: normalizedCategorySlug
          ? normalizedCategorySlug === "other"
            ? categoryName.trim() || null
            : categoryName.trim() || null
          : null,
        location: location.trim() || null,
        phone: phone.trim() || null,
        telegram: telegram.trim() || null,
        whatsapp: whatsapp.trim() || null,
        instagram: instagram.trim() || null,
        bale: bale.trim() || null,
        website: website.trim() || null,
        support_contact: supportContact.trim() || null,
        social_links: socialLinks.map((link, index) => ({
          label: makeSocialLinkLabel(link.platform, link.customLabel),
          url: link.url.trim(),
          icon_key: link.platform,
          sort_order: index,
          is_active: link.is_active,
        })),
        is_active: isActive,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیره تنظیمات فروشگاه ممکن نشد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-3xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <FormSection
            title="هویت بصری"
            description="ابتدا لوگو و تصویر روی جلد را بارگذاری کنید. این‌ها نمایان‌ترین بخش‌های فروشگاه هستند."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">لوگو</p>
                <div className="overflow-hidden rounded-3xl border border-dashed border-border bg-surface-muted">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="پیش‌نمایش لوگوی فروشگاه" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-sm text-foreground-muted">
                      هنوز لوگویی بارگذاری نشده است
                    </div>
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                <Button type="button" variant="secondary" onClick={() => logoInputRef.current?.click()} loading={logoUploading}>
                  {logoPreview ? "جایگزینی لوگو" : "بارگذاری لوگو"}
                </Button>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">تصویر روی جلد</p>
                <div className="overflow-hidden rounded-3xl border border-dashed border-border bg-surface-muted">
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="پیش‌نمایش تصویر روی جلد" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-sm text-foreground-muted">
                      هنوز تصویری برای جلد بارگذاری نشده است
                    </div>
                  )}
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={uploadCover} />
                <Button type="button" variant="secondary" onClick={() => coverInputRef.current?.click()} loading={coverUploading}>
                  {coverPreview ? "جایگزینی تصویر روی جلد" : "بارگذاری تصویر روی جلد"}
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input label="نام فروشگاه" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input
                label="اسلاگ"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                hint="در نشانی فروشگاه شما استفاده می‌شود"
                required
              />
              <Textarea
                label="توضیحات"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="md:col-span-2"
              />
              <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                <Select
                  label="دسته‌بندی فروشگاه"
                  value={categorySlug}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCategorySlug(next);
                    if (next !== "other") {
                      setCategoryName(SELLER_STORE_CATEGORY_OPTIONS.find((item) => item.slug === next)?.label ?? "");
                    }
                  }}
                >
                  <option value="">انتخاب دسته‌بندی</option>
                  {SELLER_STORE_CATEGORY_OPTIONS.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.label}
                    </option>
                  ))}
                </Select>
                {categorySlug === "other" && (
                  <Input
                    label="عنوان دسته‌بندی"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="md:col-span-2"
                  />
                )}
              </div>
            </div>
          </FormSection>

          <FormSection title="اطلاعات تماس" description="فقط فیلدهای تکمیل‌شده در صفحه عمومی نمایش داده می‌شوند.">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="موقعیت" value={location} onChange={(e) => setLocation(e.target.value)} />
              <Input label="تلفن" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="تلگرام" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
              <Input label="واتساپ" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              <Input label="اینستاگرام" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
              <Input label="بله" value={bale} onChange={(e) => setBale(e.target.value)} />
              <Input label="وب‌سایت" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
              <Input label="راه ارتباطی پشتیبانی" value={supportContact} onChange={(e) => setSupportContact(e.target.value)} />
            </div>
          </FormSection>
        </div>

        <div className="space-y-6">
          <FormSection
            title="لینک‌های اجتماعی"
            description="می‌توانید تعداد نامحدودی لینک اضافه کنید. پلتفرم انتخابی آیکن عمومی را تعیین می‌کند."
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
                  description="تلگرام، واتساپ، اینستاگرام، دیسکورد، ایکس/توییتر، وب‌سایت یا سایر لینک‌ها را اضافه کنید."
                  action={
                    <Button type="button" variant="secondary" onClick={() => setSocialLinks([blankLink()])}>
                      افزودن اولین لینک
                    </Button>
                  }
                />
              ) : (
                socialLinks.map((link, index) => (
                  <div key={`${index}-${link.platform}-${link.url}`} className="rounded-3xl border border-neutral-200 p-4">
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
                        <Input
                          label="نشانی"
                          value={link.url}
                          onChange={(e) => updateLink(index, { url: e.target.value })}
                          type={link.platform === "email" ? "email" : "url"}
                        />
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={link.is_active}
                            onChange={(e) => updateLink(index, { is_active: e.target.checked })}
                          />
                          فعال
                        </label>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => moveLink(index, -1)} disabled={index === 0}>
                        بالا
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveLink(index, 1)}
                        disabled={index === socialLinks.length - 1}
                      >
                        پایین
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        onClick={() => setSocialLinks((prev) => prev.filter((_, i) => i !== index))}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </FormSection>

          <FormSection title="نمایش" description="می‌توانید تا زمان آماده‌سازی، فروشگاه را منتشر یا مخفی کنید.">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border"
                />
                فروشگاه فعال است
              </label>
              <Button type="submit" loading={loading} className="w-full">
                ذخیره تغییرات
              </Button>
              <p className="text-xs text-foreground-muted">
                گالری محصولات، فرم‌های محصول و پردازش سفارش در بخش محصولات و سفارش‌ها قرار دارد.
              </p>
            </div>
          </FormSection>
        </div>
      </div>
    </form>
  );
}
