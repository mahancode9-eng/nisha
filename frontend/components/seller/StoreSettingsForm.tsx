"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api/errors";
import { uploadPublicImage } from "@/lib/api/public/uploads";
import { resolveMediaUrl } from "@/lib/media";
import { paths } from "@/lib/auth/paths";
import { SELLER_STORE_CATEGORY_OPTIONS } from "@/lib/seller/storeCategories";
import { useSellerEntitlements } from "@/hooks/useSellerEntitlements";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormSection } from "@/components/ui/FormSection";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  SOCIAL_PLATFORM_OPTIONS,
  SocialIcon,
  type SocialPlatformKey,
  getSocialPlatformLabel,
} from "@/components/ui/SocialIcon";
import { socialInputHint, socialInputPlaceholder } from "@/lib/seller/contactChannels";
import * as messengerApi from "@/lib/api/seller/messenger";
import { formatMoneyInput, moneyInputToNumber, parseMoneyInput } from "@/lib/moneyInput";
import { cn } from "@/lib/cn";
import { useToast } from "@/contexts/ToastContext";
import type { Store, StoreUpdate } from "@/types/seller/store";
import type { MessengerStatus } from "@/lib/api/seller/messenger";

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
  const toast = useToast();
  const { entitlements } = useSellerEntitlements();
  const canGuestCheckout = entitlements.guest_checkout;
  const canTheme = entitlements.store_theme;
  const canPages = entitlements.store_pages;
  const canReceiptReminder = Boolean(entitlements.configurable_receipt_reminder);
  const smsQuota = entitlements.sms_monthly_quota;
  const smsSent = store.sms_sent_count ?? 0;
  const [messenger, setMessenger] = useState<MessengerStatus | null>(null);
  const [messengerBusy, setMessengerBusy] = useState<"telegram" | "bale" | null>(null);
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
  const [isPublished, setIsPublished] = useState(store.is_published);
  const [dmTemplates, setDmTemplates] = useState<{ title: string; body: string }[]>(
    store.dm_reply_templates ?? [],
  );
  const [guestCheckoutEnabled, setGuestCheckoutEnabled] = useState(
    Boolean(store.guest_checkout_enabled && entitlements.guest_checkout),
  );
  const [themePreset, setThemePreset] = useState(store.theme_preset ?? "default");
  const [designStyle, setDesignStyle] = useState(store.design_style ?? "saas");
  const [primaryColor, setPrimaryColor] = useState(store.primary_color ?? "");
  const [aboutText, setAboutText] = useState(store.about_text ?? "");
  const [shippingPolicyText, setShippingPolicyText] = useState(store.shipping_policy_text ?? "");
  const [defaultShippingCost, setDefaultShippingCost] = useState(() =>
    formatMoneyInput(store.default_shipping_cost ?? "0"),
  );
  const [freeShippingMinSubtotal, setFreeShippingMinSubtotal] = useState(() =>
    store.free_shipping_min_subtotal ? formatMoneyInput(store.free_shipping_min_subtotal) : "",
  );
  const [paymentReminderMinutes, setPaymentReminderMinutes] = useState(
    store.payment_reminder_minutes != null ? String(store.payment_reminder_minutes) : "",
  );
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
    let cancelled = false;
    void messengerApi
      .getMessengerStatus()
      .then((status) => {
        if (!cancelled) setMessenger(status);
      })
      .catch(() => {
        if (!cancelled) setMessenger(null);
      });
    return () => {
      cancelled = true;
    };
  }, [store.id]);

  async function handleMessengerConnect(channel: "telegram" | "bale") {
    setMessengerBusy(channel);
    try {
      const res = await messengerApi.connectMessenger(channel);
      window.open(res.deep_link, "_blank", "noopener,noreferrer");
      toast.success("ربات باز شد. استارت رو بزن تا وصل بشه.");
      setMessenger(await messengerApi.getMessengerStatus());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "وصل نشد. دوباره امتحان کن.");
    } finally {
      setMessengerBusy(null);
    }
  }

  async function handleMessengerDisconnect(channel: "telegram" | "bale") {
    setMessengerBusy(channel);
    try {
      setMessenger(await messengerApi.disconnectMessenger(channel));
      toast.success("قطع شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "قطع نشد. دوباره امتحان کن.");
    } finally {
      setMessengerBusy(null);
    }
  }

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
    setIsPublished(store.is_published);
    setDmTemplates(store.dm_reply_templates ?? []);
    setGuestCheckoutEnabled(Boolean(store.guest_checkout_enabled && canGuestCheckout));
    setThemePreset(store.theme_preset ?? "default");
    setDesignStyle(store.design_style ?? "saas");
    setPrimaryColor(store.primary_color ?? "");
    setAboutText(store.about_text ?? "");
    setShippingPolicyText(store.shipping_policy_text ?? "");
    setDefaultShippingCost(formatMoneyInput(store.default_shipping_cost ?? "0"));
    setFreeShippingMinSubtotal(
      store.free_shipping_min_subtotal ? formatMoneyInput(store.free_shipping_min_subtotal) : "",
    );
    setPaymentReminderMinutes(
      store.payment_reminder_minutes != null ? String(store.payment_reminder_minutes) : "",
    );
    setLogoPreview(store.logo_url ? resolveMediaUrl(store.logo_url) : null);
    setCoverPreview(store.cover_image_url ? resolveMediaUrl(store.cover_image_url) : null);
  }, [store, canGuestCheckout]);

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
      setError(err instanceof ApiError ? err.message : "لوگو بارگذاری نشد. دوباره امتحان کن.");
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
      setError(err instanceof ApiError ? err.message : "تصویر جلد بارگذاری نشد. دوباره امتحان کن.");
    } finally {
      setCoverUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !slug.trim()) {
      setError("نام فروشگاه و آدرس فروشگاه رو وارد کن.");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError("آدرس فروشگاه فقط می‌تونه حروف کوچک انگلیسی، عدد و خط تیره (-) داشته باشه.");
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
        is_published: isPublished,
        dm_reply_templates: dmTemplates.filter((t) => t.title.trim() && t.body.trim()),
        guest_checkout_enabled: canGuestCheckout ? guestCheckoutEnabled : false,
        ...(canTheme
          ? {
              theme_preset: themePreset || null,
              design_style: designStyle || null,
              primary_color: primaryColor.trim() || null,
            }
          : {}),
        ...(canPages
          ? {
              about_text: aboutText.trim() || null,
              shipping_policy_text: shippingPolicyText.trim() || null,
            }
          : {}),
        default_shipping_cost: parseMoneyInput(defaultShippingCost)
          ? moneyInputToNumber(defaultShippingCost)
          : 0,
        free_shipping_min_subtotal: parseMoneyInput(freeShippingMinSubtotal)
          ? moneyInputToNumber(freeShippingMinSubtotal)
          : null,
        ...(canReceiptReminder
          ? {
              payment_reminder_minutes: paymentReminderMinutes.trim()
                ? parseInt(paymentReminderMinutes, 10)
                : null,
            }
          : {}),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تنظیمات ذخیره نشد. دوباره امتحان کن.");
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
            title="لوگو و تصویر جلد"
            description="اینا اولین چیزایی هستن که مشتری تو فروشگاه می‌بینه."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">لوگو</p>
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-3xl border border-dashed border-border bg-surface-muted">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="پیش‌نمایش لوگوی فروشگاه"
                      className="h-28 w-28 rounded-2xl border border-border object-cover shadow-sm"
                    />
                  ) : (
                    <p className="px-4 text-center text-sm text-foreground-muted">
                      هنوز لوگو نذاشتی
                    </p>
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
                <Button type="button" variant="secondary" onClick={() => logoInputRef.current?.click()} loading={logoUploading}>
                  {logoPreview ? "تعویض لوگو" : "بارگذاری لوگو"}
                </Button>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">تصویر جلد</p>
                <div className="overflow-hidden rounded-3xl border border-dashed border-border bg-surface-muted">
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverPreview}
                      alt="پیش‌نمایش تصویر جلد"
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-sm text-foreground-muted">
                      هنوز تصویر جلد نذاشتی
                    </div>
                  )}
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={uploadCover} />
                <Button type="button" variant="secondary" onClick={() => coverInputRef.current?.click()} loading={coverUploading}>
                  {coverPreview ? "تعویض تصویر جلد" : "بارگذاری تصویر جلد"}
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input label="نام فروشگاه" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input
                label="آدرس فروشگاه"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                hint="بخش آخر لینک فروشگاه؛ مثلاً nishaapp.ir/store/my-shop"
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

          <FormSection title="اطلاعات تماس" description="فقط چیزایی که پر کنی، تو صفحه فروشگاه نشون داده می‌شه.">
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

          <FormSection
            title="خبر سفارش در تلگرام و بله"
            description="ربات نیشا بهت خبر می‌ده سفارش جدید اومد یا رسید آپلود شد. لینک پنل هم روشه. تو پلن پایه به بالا، عکس رسید و دکمه تایید/رد هم می‌فرسته."
          >
            <div className="space-y-3 text-sm">
              {(["telegram", "bale"] as const).map((channel) => {
                const linked =
                  channel === "telegram" ? messenger?.telegram_linked : messenger?.bale_linked;
                const configured =
                  channel === "telegram"
                    ? messenger?.telegram_configured
                    : messenger?.bale_configured;
                const label = channel === "telegram" ? "تلگرام" : "بله";
                return (
                  <div
                    key={channel}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-xs text-foreground-muted">
                        {!messenger
                          ? "وضعیت در حال بارگذاری…"
                          : !configured
                            ? "ربات هنوز از سمت نیشا تنظیم نشده"
                            : linked
                              ? "وصل است"
                              : "هنوز وصل نیست"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {linked ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          loading={messengerBusy === channel}
                          onClick={() => void handleMessengerDisconnect(channel)}
                        >
                          قطع اتصال
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          disabled={!configured}
                          loading={messengerBusy === channel}
                          onClick={() => void handleMessengerConnect(channel)}
                        >
                          اتصال
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </FormSection>
        </div>

        <div className="space-y-6">
          <FormSection
            title="لینک‌های اجتماعی"
            description="هر چند تا لینک که خواستی اضافه کن. آیکن هر لینک از روی شبکه‌ای که انتخاب می‌کنی مشخص می‌شه."
            action={
              <Button type="button" variant="secondary" size="sm" onClick={() => setSocialLinks((prev) => [...prev, blankLink()])}>
                افزودن لینک
              </Button>
            }
          >
            <div className="space-y-3">
              {socialLinks.length === 0 ? (
                <EmptyState
                  title="لینک اجتماعی نداری"
                  description="تلگرام، واتساپ، اینستاگرام، وب‌سایت یا هر لینک دیگه‌ای رو اضافه کن."
                  action={
                    <Button type="button" variant="secondary" onClick={() => setSocialLinks([blankLink()])}>
                      افزودن اولین لینک
                    </Button>
                  }
                />
              ) : (
                socialLinks.map((link, index) => (
                  <div key={`${index}-${link.platform}-${link.url}`} className="rounded-3xl border border-border bg-surface/60 p-4">
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
                            hint="اگر «دیگر» رو انتخاب کنی، این عنوان کنار لینک نشون داده می‌شه"
                          />
                        )}
                        <Input
                          label="نشانی"
                          value={link.url}
                          onChange={(e) => updateLink(index, { url: e.target.value })}
                          type={link.platform === "email" ? "email" : "text"}
                          placeholder={socialInputPlaceholder(link.platform)}
                          hint={socialInputHint(link.platform)}
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

          <FormSection
            title="هزینه ارسال"
            description="موقع ثبت سفارش، هزینه ارسال از روی این دو عدد حساب می‌شه."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <MoneyInput
                label="هزینه ارسال پایه"
                value={defaultShippingCost}
                onValueChange={setDefaultShippingCost}
                hint="اگر صفر بذاری، ارسال همیشه رایگانه"
              />
              <MoneyInput
                label="ارسال رایگان از مبلغ سفارش"
                value={freeShippingMinSubtotal}
                onValueChange={setFreeShippingMinSubtotal}
                hint="سفارش‌های بالای این مبلغ، ارسال رایگان دارن. خالی بمونه یعنی ارسال رایگان نداریم."
              />
            </div>
          </FormSection>

          <FormSection
            title="یادآوری رسید پرداخت"
            description="اگر مشتری بعد از سفارش رسید نفرستاد، بعد از چند دقیقه بهش یادآوری می‌شه."
          >
            {canReceiptReminder ? (
              <Input
                label="دقیقه تا یادآوری"
                type="number"
                min="1"
                max="1440"
                value={paymentReminderMinutes}
                onChange={(e) => setPaymentReminderMinutes(e.target.value)}
                hint="خالی یعنی یادآوری خودکار خاموشه. مثلاً ۳۰ یعنی نیم ساعت بعد."
              />
            ) : (
              <p className="text-sm text-foreground-muted">
                تنظیم زمان یادآوری از پلن پایه به بالا فعاله.{" "}
                <Link href={paths.seller.subscription} className="text-brand underline-offset-2 hover:underline">
                  ارتقای پلن
                </Link>
              </p>
            )}
          </FormSection>

          <FormSection
            title="پیامک"
            description="سهمیه پیامک این ماه برای یادآوری و پیگیری سفارش."
          >
            {smsQuota === 0 ? (
              <p className="text-sm text-foreground-muted">
                تو پلن فعلی پیامک نداری.{" "}
                <Link href={paths.seller.subscription} className="text-brand underline-offset-2 hover:underline">
                  ارتقای پلن
                </Link>
              </p>
            ) : smsQuota == null ? (
              <p className="text-sm text-foreground">
                پیامک نامحدود · این ماه {smsSent.toLocaleString("fa-IR")} تا فرستادی
              </p>
            ) : (
              <p className="text-sm text-foreground">
                {smsSent.toLocaleString("fa-IR")} از {smsQuota.toLocaleString("fa-IR")} پیامک این ماه
              </p>
            )}
          </FormSection>

          <FormSection
            title="ظاهر فروشگاه (ویترین عمومی)"
            description="تم و رنگ صفحه فروشگاه، جدا از ظاهر پنلت."
          >
            {!(canTheme || canPages) && (
              <p className="text-sm text-foreground-muted">
                تنظیم تم از پلن حرفه‌ای به بالا فعاله.{" "}
                <Link href={paths.seller.subscription} className="text-brand underline-offset-2 hover:underline">
                  ارتقای پلن
                </Link>
              </p>
            )}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">سبک ویترین</p>
              <p className="text-xs text-foreground-muted">
                این سبک فقط روی صفحه فروشگاه اعمال می‌شه و ظاهر پنلت رو عوض نمی‌کنه.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: "saas", label: "مدرن" },
                    { value: "classic", label: "کلاسیک" },
                    { value: "glass", label: "شیشه‌ای" },
                  ] as const
                ).map((option) => {
                  const active = designStyle === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={!canTheme}
                      onClick={() => setDesignStyle(option.value)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-sm font-medium transition disabled:opacity-60",
                        active
                          ? "border-brand bg-brand/10 text-foreground ring-1 ring-brand/30"
                          : "border-border text-foreground-muted hover:border-brand/40 hover:text-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span>تم رنگ ویترین</span>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 disabled:opacity-60"
                  value={themePreset}
                  disabled={!canTheme}
                  onChange={(e) => setThemePreset(e.target.value)}
                >
                  <option value="default">پیش‌فرض</option>
                  <option value="warm">گرم</option>
                  <option value="cool">سرد</option>
                  <option value="contrast">پرکنتراست</option>
                </select>
              </label>
              <Input
                label="رنگ اصلی (مثلاً #0F766E)"
                value={primaryColor}
                disabled={!canTheme}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
            </div>
            <Textarea
              label="درباره فروشگاه"
              value={aboutText}
              disabled={!canPages}
              onChange={(e) => setAboutText(e.target.value)}
              rows={4}
            />
            <Textarea
              label="سیاست ارسال"
              value={shippingPolicyText}
              disabled={!canPages}
              onChange={(e) => setShippingPolicyText(e.target.value)}
              rows={4}
            />
          </FormSection>

          <FormSection title="نمایش" description="تا وقتی فروشگاه آماده نشده، می‌تونی از دید مشتری‌ها پنهانش کنی.">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={guestCheckoutEnabled}
                  disabled={!canGuestCheckout}
                  onChange={(e) => setGuestCheckoutEnabled(e.target.checked)}
                  className="rounded border-border"
                />
                خرید بدون ورود (مهمان)
              </label>
              {!canGuestCheckout ? (
                <p className="text-xs text-foreground-muted">
                  خرید مهمان تو پلن فعلی‌ت نیست.{" "}
                  <Link href={paths.seller.subscription} className="text-brand underline-offset-2 hover:underline">
                    ارتقای پلن
                  </Link>
                </p>
              ) : (
                <p className="text-xs text-foreground-muted">
                  اگر خاموش باشه، مشتری برای خرید باید حساب بسازه.
                </p>
              )}
              <div className="space-y-2 rounded-xl border border-border p-3">
                <p className="text-sm font-medium text-foreground">قالب پاسخ پیام</p>
                <p className="text-xs text-foreground-muted">
                  لینک بیو اینستاگرام:{" "}
                  <span className="font-mono" dir="ltr">
                    /store/{slug}/links
                  </span>
                </p>
                {dmTemplates.map((template, index) => (
                  <div key={index} className="space-y-2 rounded-lg bg-surface-muted/40 p-2">
                    <Input
                      label="عنوان"
                      value={template.title}
                      onChange={(e) => {
                        const next = [...dmTemplates];
                        next[index] = { ...next[index], title: e.target.value };
                        setDmTemplates(next);
                      }}
                    />
                    <Textarea
                      label="متن"
                      value={template.body}
                      onChange={(e) => {
                        const next = [...dmTemplates];
                        next[index] = { ...next[index], body: e.target.value };
                        setDmTemplates(next);
                      }}
                      rows={2}
                    />
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={() => setDmTemplates(dmTemplates.filter((_, i) => i !== index))}
                    >
                      حذف
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setDmTemplates([...dmTemplates, { title: "", body: "" }])}
                >
                  قالب جدید
                </Button>
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-border"
                />
                فروشگاه منتشر شده (عمومی)
              </label>
              <p className="text-xs text-foreground-muted">
                تا وقتی منتشر نکنی، صفحه فروشگاه برای مشتری‌ها باز نمی‌شه و تو نقشه سایت نمیاد.
              </p>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border"
                />
                فروشگاه فعاله
              </label>
              <p className="text-xs text-foreground-muted">
                اگه خاموش باشه، فروشگاه موقتاً از دسترس خارج می‌شه (حتی اگر قبلاً منتشر شده باشه).
              </p>
              <Button type="submit" loading={loading} className="w-full">
                ذخیره تغییرات
              </Button>
              <p className="text-xs text-foreground-muted">
                محصول‌ها و سفارش‌ها رو از منوی کناری، تو بخش خودشون مدیریت کن.
              </p>
            </div>
          </FormSection>
        </div>
      </div>
    </form>
  );
}
