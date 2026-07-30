"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadPublicImage } from "@/lib/api/public/uploads";
import * as onboardingApi from "@/lib/api/seller/onboarding";
import * as paymentMethodsApi from "@/lib/api/seller/payment-methods";
import * as productsApi from "@/lib/api/seller/products";
import * as storeApi from "@/lib/api/seller/store";
import { paths } from "@/lib/auth/paths";
import { formatMoney } from "@/lib/format";
import { formatMoneyInput, parseMoneyInput } from "@/lib/moneyInput";
import { cn } from "@/lib/cn";
import { resolveMediaUrl } from "@/lib/media";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  SOCIAL_PLATFORM_OPTIONS,
  SocialIcon,
  type SocialPlatformKey,
} from "@/components/ui/SocialIcon";
import { makeSocialLinkLabel, normalizeSocialPlatform, resolveContactHref, socialInputHint, socialInputPlaceholder } from "@/lib/seller/contactChannels";
import { BrandMark } from "@/components/layout/chrome/BrandMark";
import type { PaymentMethodCreate, PaymentMethodType } from "@/types/seller/payment-method";
import type { SellerOnboardingResponse, SellerOnboardingStepKey } from "@/types/seller/onboarding";

type EditableContactLink = {
  platform: SocialPlatformKey;
  customLabel: string;
  url: string;
  is_active: boolean;
};

type DraftState = {
  storeIdentity: {
    name: string;
    logoUrl: string;
    coverImageUrl: string;
  };
  storeInformation: {
    description: string;
    categorySlug: string;
    categoryName: string;
    location: string;
  };
  contactChannels: EditableContactLink[];
  paymentDetails: {
    type: PaymentMethodType;
    displayName: string;
    cardNumber: string;
    ownerName: string;
    walletAddress: string;
    externalUrl: string;
    instructions: string;
    isActive: boolean;
  };
  firstProduct: {
    title: string;
    price: string;
    description: string;
    imageUrl: string;
    thumbnailUrl: string;
    stockQuantity: number;
    isActive: boolean;
  };
};

type StepMeta = {
  key: SellerOnboardingStepKey;
  title: string;
  description: string;
  helper: string;
};

const STEP_ORDER: StepMeta[] = [
  {
    key: "welcome",
    title: "خوش آمدی",
    description: "چند دقیقه وقت بگذار؛ با هم فروشگاهت را راه می‌اندازیم.",
    helper: "هر وقت خواستی می‌توانی بعداً ادامه بدهی.",
  },
  {
    key: "store_identity",
    title: "نام و ظاهر فروشگاه",
    description: "اسمی که مشتری می‌بیند، با لوگو و کاور قشنگ.",
    helper: "بعداً هم می‌توانی عوضشان کنی.",
  },
  {
    key: "store_information",
    title: "درباره فروشگاه",
    description: "یک توضیح کوتاه و دسته‌بندی تا مشتری بداند چه می‌فروشی.",
    helper: "هرچه روشن‌تر بنویسی، اعتماد بیشتر می‌شود.",
  },
  {
    key: "contact_channels",
    title: "راه ارتباطی",
    description: "اختیاری — اینستاگرام، تلگرام یا هر لینکی که مشتری لازم دارد.",
    helper: "اگر الان نداری، رد کن و بعداً اضافه کن.",
  },
  {
    key: "payment_details",
    title: "جزئیات پرداخت",
    description: "کارت، رمزارز یا درگاه — تا مشتری بداند چطور پرداخت کند.",
    helper: "بدون روش پرداخت، سفارش کامل نمی‌شود.",
  },
  {
    key: "first_product",
    title: "اولین محصول",
    description: "یک محصول با عکس و قیمت کافی است تا فروشگاه زنده شود.",
    helper: "بعداً می‌توانی محصول‌های بیشتری اضافه کنی.",
  },
  {
    key: "activation",
    title: "آماده‌ای!",
    description: "چک‌لیست را ببین و برو سراغ داشبورد.",
    helper: "اگر چیزی کم است، از داشبورد برمی‌گردی و کاملش می‌کنی.",
  },
];

function normalizeStepKey(step: SellerOnboardingStepKey): SellerOnboardingStepKey {
  if (step === "education") return "store_identity";
  return step;
}

function blankContactLink(): EditableContactLink {
  return {
    platform: "telegram",
    customLabel: "",
    url: "",
    is_active: true,
  };
}

function toEditableContact(link: SellerOnboardingResponse["store"]["social_links"][number]): EditableContactLink {
  const platform = normalizeSocialPlatform(link.icon_key, link.label);
  return {
    platform,
    customLabel: platform === "other" ? link.label : "",
    url: link.url,
    is_active: link.is_active,
  };
}

function paymentTypeLabel(type: PaymentMethodType): string {
  if (type === "CARD_TO_CARD") return "کارت‌به‌کارت";
  if (type === "CRYPTO") return "رمزارز";
  return "درگاه خارجی";
}

function buildDrafts(data: SellerOnboardingResponse): DraftState {
  const { store, state } = data;
  const payment = state.drafts.payment_details;
  return {
    storeIdentity: {
      name: state.drafts.store_identity.name ?? store.name ?? "",
      logoUrl: state.drafts.store_identity.logo_url ?? store.logo_url ?? "",
      coverImageUrl: state.drafts.store_identity.cover_image_url ?? store.cover_image_url ?? "",
    },
    storeInformation: {
      description: state.drafts.store_information.description ?? store.description ?? "",
      categorySlug: state.drafts.store_information.category_slug ?? store.category_slug ?? "",
      categoryName: state.drafts.store_information.category_name ?? store.category_name ?? "",
      location: state.drafts.store_information.location ?? store.location ?? "",
    },
    contactChannels:
      state.drafts.contact_channels.length > 0
        ? state.drafts.contact_channels.map((link) => ({
            platform: link.platform as SocialPlatformKey,
            customLabel: link.platform === "other" ? link.label : "",
            url: link.url,
            is_active: link.is_active,
          }))
        : store.social_links.map(toEditableContact),
    paymentDetails: {
      type: payment?.type ?? "CARD_TO_CARD",
      displayName: payment?.display_name ?? "",
      cardNumber: payment?.card_number ?? "",
      ownerName: payment?.owner_name ?? "",
      walletAddress: payment?.wallet_address ?? "",
      externalUrl: payment?.external_url ?? "",
      instructions: payment?.instructions ?? "",
      isActive: payment?.is_active ?? true,
    },
    firstProduct: {
      title: state.drafts.first_product.title ?? "",
      price: state.drafts.first_product.price ? formatMoneyInput(state.drafts.first_product.price) : "",
      description: state.drafts.first_product.description ?? "",
      imageUrl: state.drafts.first_product.image_url ?? "",
      thumbnailUrl: state.drafts.first_product.thumbnail_url ?? "",
      stockQuantity: state.drafts.first_product.stock_quantity ?? 1,
      isActive: state.drafts.first_product.is_active ?? true,
    },
  };
}

function stepIndex(step: SellerOnboardingStepKey): number {
  const normalized = normalizeStepKey(step);
  return STEP_ORDER.findIndex((item) => item.key === normalized);
}

function isValidMoney(value: string): boolean {
  const raw = parseMoneyInput(value);
  return /^\d+(\.\d{1,2})?$/.test(raw) && Number(raw) > 0;
}

function moneyForApi(value: string): string {
  return parseMoneyInput(value);
}

function useBlobPreview() {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    },
    [preview],
  );

  return [preview, setPreview] as const;
}

async function uploadImageWithPreview(file: File, setPreview: (value: string | null) => void) {
  const objectUrl = URL.createObjectURL(file);
  setPreview(objectUrl);
  try {
    return await uploadPublicImage(file);
  } catch (err) {
    setPreview(null);
    throw err;
  }
}

function StepBadge({ active, done, label }: { active?: boolean; done?: boolean; label: string }) {
  return (
    <div
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        done
          ? "bg-brand/15 text-brand"
          : active
            ? "bg-surface text-foreground"
            : "bg-surface-muted text-foreground-muted",
      )}
    >
      {label}
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
      {Array.from({ length: total }).map((_, index) => {
        const active = index <= current;
        return (
          <div
            key={index}
            className={cn("h-2 rounded-full transition-colors", active ? "bg-brand" : "bg-border")}
          />
        );
      })}
    </div>
  );
}

function resolveActiveStepIndex(state: SellerOnboardingStepKey): number {
  const index = stepIndex(state);
  return index === -1 ? 0 : index;
}

export function SellerOnboardingExperience({ data }: { data: SellerOnboardingResponse }) {
  const router = useRouter();
  const toast = useToast();
  const [serverState, setServerState] = useState(data.state);
  const [activeStepKey, setActiveStepKey] = useState<SellerOnboardingStepKey>(
    normalizeStepKey(data.state.current_step),
  );
  const [drafts, setDrafts] = useState<DraftState>(() => buildDrafts(data));
  const [draftVersion, setDraftVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingNote, setSavingNote] = useState<string | null>("نگران نباش، تغییراتت خودکار ذخیره می‌شود");
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useBlobPreview();
  const [coverPreview, setCoverPreview] = useBlobPreview();
  const [productPreview, setProductPreview] = useBlobPreview();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const productImageInputRef = useRef<HTMLInputElement | null>(null);

  const activeStepIndex = resolveActiveStepIndex(activeStepKey);
  const activeStep = STEP_ORDER[activeStepIndex] ?? STEP_ORDER[0];
  const progressPercent = Math.round(((activeStepIndex + 1) / STEP_ORDER.length) * 100);
  const hasCompletedOnboarding = serverState.status === "COMPLETED";
  const completedSteps = serverState.completed_steps;

  useEffect(() => {
    if (data.state.status === "COMPLETED") {
      router.replace(paths.seller.dashboard);
    }
  }, [data.state.status, router]);

  useEffect(() => {
    setServerState(data.state);
    setDrafts(buildDrafts(data));
    setActiveStepKey(normalizeStepKey(data.state.current_step));
  }, [data]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draftVersion === 0 || loading) return;
      if (activeStep.key === "welcome" || activeStep.key === "activation") return;
      void (async () => {
        try {
          setSavingNote("در حال ذخیره...");
          const response = await onboardingApi.updateOnboarding({
            current_step: activeStep.key,
            store_identity:
              activeStep.key === "store_identity"
                ? {
                    name: drafts.storeIdentity.name,
                    logo_url: drafts.storeIdentity.logoUrl || null,
                    cover_image_url: drafts.storeIdentity.coverImageUrl || null,
                  }
                : undefined,
            store_information:
              activeStep.key === "store_information"
                ? {
                    description: drafts.storeInformation.description || null,
                    category_slug: drafts.storeInformation.categorySlug || null,
                    category_name: drafts.storeInformation.categoryName || null,
                    location: drafts.storeInformation.location || null,
                  }
                : undefined,
            contact_channels:
              activeStep.key === "contact_channels"
                ? drafts.contactChannels.map((link) => ({
                    platform: link.platform,
                    label: makeSocialLinkLabel(link.platform, link.customLabel),
                    url: link.url,
                    is_active: link.is_active,
                  }))
                : undefined,
            payment_details:
              activeStep.key === "payment_details"
                ? {
                    payment_method_id: serverState.payment_method_id,
                    type: drafts.paymentDetails.type,
                    display_name: drafts.paymentDetails.displayName || null,
                    card_number: drafts.paymentDetails.cardNumber || null,
                    owner_name: drafts.paymentDetails.ownerName || null,
                    wallet_address: drafts.paymentDetails.walletAddress || null,
                    external_url: drafts.paymentDetails.externalUrl || null,
                    instructions: drafts.paymentDetails.instructions || null,
                    is_active: drafts.paymentDetails.isActive,
                  }
                : undefined,
            first_product:
              activeStep.key === "first_product"
                ? {
                    product_id: drafts.firstProduct.imageUrl ? serverState.first_product_id : null,
                    title: drafts.firstProduct.title,
                    price: moneyForApi(drafts.firstProduct.price) || null,
                    description: drafts.firstProduct.description || null,
                    image_url: drafts.firstProduct.imageUrl || null,
                    thumbnail_url: drafts.firstProduct.thumbnailUrl || null,
                    stock_quantity: drafts.firstProduct.stockQuantity,
                    is_active: drafts.firstProduct.isActive,
                  }
                : undefined,
            first_product_id: serverState.first_product_id,
            payment_method_id: serverState.payment_method_id,
          });
          setServerState(response.state);
          setSavingNote("ذخیره شد");
        } catch {
          setSavingNote("ذخیره خودکار نشد؛ یک‌بار دیگر امتحان کن");
        }
      })();
    }, 700);

    return () => window.clearTimeout(timer);
  }, [activeStep.key, draftVersion, drafts, loading, serverState.first_product_id, serverState.payment_method_id]);

  function markDraftChange(updater: (current: DraftState) => DraftState) {
    setDrafts((current) => updater(current));
    setDraftVersion((current) => current + 1);
  }

  async function saveOnboardingProgress(payload: Partial<Parameters<typeof onboardingApi.updateOnboarding>[0]>) {
    const response = await onboardingApi.updateOnboarding(payload);
    setServerState(response.state);
    setActiveStepKey(response.state.current_step);
    setDraftVersion(0);
    return response;
  }

  function buildNavigationPayload(targetStep: SellerOnboardingStepKey) {
    const base = {
      current_step: targetStep,
      status: "IN_PROGRESS" as const,
    };

    switch (activeStep.key) {
      case "store_identity":
        return {
          ...base,
          store_identity: {
            name: drafts.storeIdentity.name.trim() || null,
            logo_url: drafts.storeIdentity.logoUrl || null,
            cover_image_url: drafts.storeIdentity.coverImageUrl || null,
          },
        };
      case "store_information":
        return {
          ...base,
          store_information: {
            description: drafts.storeInformation.description.trim() || null,
            category_slug: drafts.storeInformation.categorySlug.trim() || null,
            category_name:
              drafts.storeInformation.categorySlug === "other"
                ? drafts.storeInformation.categoryName.trim() || null
                : drafts.storeInformation.categoryName.trim() || null,
            location: drafts.storeInformation.location.trim() || null,
          },
        };
      case "contact_channels":
        return {
          ...base,
          contact_channels: drafts.contactChannels
            .filter((link) => link.url.trim())
            .map((link) => ({
            platform: link.platform,
            label: makeSocialLinkLabel(link.platform, link.customLabel),
            url: resolveContactHref(link.platform, link.url),
            is_active: link.is_active,
          })),
        };
      case "payment_details":
        return {
          ...base,
          payment_method_id: serverState.payment_method_id,
          payment_details: {
            payment_method_id: serverState.payment_method_id,
            type: drafts.paymentDetails.type,
            display_name: drafts.paymentDetails.displayName.trim() || null,
            card_number: drafts.paymentDetails.cardNumber.trim() || null,
            owner_name: drafts.paymentDetails.ownerName.trim() || null,
            wallet_address: drafts.paymentDetails.walletAddress.trim() || null,
            external_url: drafts.paymentDetails.externalUrl.trim() || null,
            instructions: drafts.paymentDetails.instructions.trim() || null,
            is_active: drafts.paymentDetails.isActive,
          },
        };
      case "first_product":
        return {
          ...base,
          first_product_id: serverState.first_product_id,
          first_product: {
            product_id: serverState.first_product_id,
            title: drafts.firstProduct.title.trim() || null,
            price: isValidMoney(drafts.firstProduct.price) ? moneyForApi(drafts.firstProduct.price) : null,
            description: drafts.firstProduct.description.trim() || null,
            image_url: drafts.firstProduct.imageUrl || null,
            thumbnail_url: drafts.firstProduct.thumbnailUrl || null,
            stock_quantity: drafts.firstProduct.stockQuantity,
            is_active: drafts.firstProduct.isActive,
          },
        };
      default:
        return base;
    }
  }

  async function moveStep(offset: number) {
    const nextIndex = Math.max(0, Math.min(STEP_ORDER.length - 1, activeStepIndex + offset));
    const targetStep = STEP_ORDER[nextIndex]?.key ?? activeStep.key;
    if (targetStep === activeStep.key) return;
    setLoading(true);
    setError(null);
    try {
      await saveOnboardingProgress(buildNavigationPayload(targetStep));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ذخیره مرحله ناموفق بود";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function continueWelcome() {
    setLoading(true);
    setError(null);
    try {
      await saveOnboardingProgress({
        current_step: "store_identity",
        completed_steps: [...completedSteps, "welcome"],
        status: "IN_PROGRESS",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "شروع راه‌اندازی ممکن نشد";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function skipWelcome() {
    setLoading(true);
    setError(null);
    try {
      await saveOnboardingProgress({
        current_step: "store_identity",
        completed_steps: [...completedSteps, "welcome"],
        status: "SKIPPED",
      });
      router.replace(paths.seller.dashboard);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ذخیره ممکن نشد";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  async function continueStoreIdentity() {
    setLoading(true);
    setError(null);
    try {
      if (!drafts.storeIdentity.name.trim()) {
        throw new Error("نام فروشگاه را وارد کنید.");
      }

      await storeApi.updateStore({
        name: drafts.storeIdentity.name.trim(),
        logo_url: drafts.storeIdentity.logoUrl.trim() || null,
        cover_image_url: drafts.storeIdentity.coverImageUrl.trim() || null,
      });
      await saveOnboardingProgress({
        current_step: "store_information",
        completed_steps: [...completedSteps, "store_identity"],
        store_identity: {
          name: drafts.storeIdentity.name.trim(),
          logo_url: drafts.storeIdentity.logoUrl.trim() || null,
          cover_image_url: drafts.storeIdentity.coverImageUrl.trim() || null,
        },
        status: "IN_PROGRESS",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ذخیره هویت فروشگاه ناموفق بود";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function continueStoreInformation() {
    setLoading(true);
    setError(null);
    try {
      if (!drafts.storeInformation.description.trim()) {
        throw new Error("توضیحات فروشگاه الزامی است.");
      }
      if (!drafts.storeInformation.categorySlug.trim()) {
        throw new Error("دسته‌بندی فروشگاه را انتخاب کنید.");
      }
      if (drafts.storeInformation.categorySlug === "other" && !drafts.storeInformation.categoryName.trim()) {
        throw new Error("برای دسته‌بندی دیگر، یک عنوان سفارشی وارد کنید.");
      }

      await storeApi.updateStore({
        description: drafts.storeInformation.description.trim() || null,
        category_slug: drafts.storeInformation.categorySlug.trim() || null,
        category_name:
          drafts.storeInformation.categorySlug === "other"
            ? drafts.storeInformation.categoryName.trim() || null
            : drafts.storeInformation.categoryName.trim() || null,
        location: drafts.storeInformation.location.trim() || null,
      });

      await saveOnboardingProgress({
        current_step: "contact_channels",
        completed_steps: [...completedSteps, "store_information"],
        store_information: {
          description: drafts.storeInformation.description.trim() || null,
          category_slug: drafts.storeInformation.categorySlug.trim() || null,
          category_name:
            drafts.storeInformation.categorySlug === "other"
              ? drafts.storeInformation.categoryName.trim() || null
              : drafts.storeInformation.categoryName.trim() || null,
          location: drafts.storeInformation.location.trim() || null,
        },
        status: "IN_PROGRESS",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ذخیره اطلاعات فروشگاه ناموفق بود";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function continueContactChannels() {
    setLoading(true);
    setError(null);
    try {
      const activeLinks = drafts.contactChannels.filter((link) => link.url.trim());
      if (activeLinks.some((link) => link.platform === "other" && !link.customLabel.trim())) {
        throw new Error("برای لینک‌های با برچسب سفارشی، یک عنوان وارد کنید.");
      }

      const social_links = activeLinks.map((link, index) => ({
        label: makeSocialLinkLabel(link.platform, link.customLabel),
        url: resolveContactHref(link.platform, link.url),
        icon_key: link.platform,
        sort_order: index,
        is_active: link.is_active,
      }));

      await storeApi.updateStore({ social_links });
      await saveOnboardingProgress({
        current_step: "payment_details",
        completed_steps: [...completedSteps, "contact_channels"],
        contact_channels: social_links.map((link) => ({
          platform: (link.icon_key ?? "other") as SocialPlatformKey,
          label: link.label,
          url: link.url,
          is_active: link.is_active,
        })),
        status: "IN_PROGRESS",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ذخیره راه‌های ارتباطی ناموفق بود";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function skipContactChannels() {
    setLoading(true);
    setError(null);
    try {
      await saveOnboardingProgress({
        current_step: "payment_details",
        completed_steps: [...completedSteps, "contact_channels"],
        status: "IN_PROGRESS",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ذخیره ممکن نشد";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function buildPaymentPayload(): PaymentMethodCreate {
    const base = {
      type: drafts.paymentDetails.type,
      display_name: drafts.paymentDetails.displayName.trim(),
      instructions: drafts.paymentDetails.instructions.trim() || null,
      is_active: drafts.paymentDetails.isActive,
    };
    if (drafts.paymentDetails.type === "CARD_TO_CARD") {
      return {
        ...base,
        card_number: drafts.paymentDetails.cardNumber.trim(),
        owner_name: drafts.paymentDetails.ownerName.trim(),
      };
    }
    if (drafts.paymentDetails.type === "CRYPTO") {
      return {
        ...base,
        wallet_address: drafts.paymentDetails.walletAddress.trim(),
      };
    }
    return {
      ...base,
      external_url: drafts.paymentDetails.externalUrl.trim(),
    };
  }

  function buildPaymentUpdatePayload() {
    const payload = buildPaymentPayload();
    return {
      ...payload,
      card_number: payload.type === "CARD_TO_CARD" ? payload.card_number ?? null : null,
      owner_name: payload.type === "CARD_TO_CARD" ? payload.owner_name ?? null : null,
      wallet_address: payload.type === "CRYPTO" ? payload.wallet_address ?? null : null,
      external_url: payload.type === "EXTERNAL_GATEWAY" ? payload.external_url ?? null : null,
    };
  }

  function validatePaymentDetails() {
    if (!drafts.paymentDetails.displayName.trim()) {
      throw new Error("نام نمایشی روش پرداخت الزامی است.");
    }
    if (drafts.paymentDetails.type === "CARD_TO_CARD") {
      if (!drafts.paymentDetails.cardNumber.trim()) {
        throw new Error("شماره کارت را وارد کنید.");
      }
      if (!drafts.paymentDetails.ownerName.trim()) {
        throw new Error("نام صاحب حساب را وارد کنید.");
      }
    } else if (drafts.paymentDetails.type === "CRYPTO") {
      if (!drafts.paymentDetails.walletAddress.trim()) {
        throw new Error("آدرس کیف پول را وارد کنید.");
      }
    } else if (!drafts.paymentDetails.externalUrl.trim()) {
      throw new Error("نشانی درگاه را وارد کنید.");
    }
  }

  async function continuePaymentDetails() {
    setLoading(true);
    setError(null);
    try {
      validatePaymentDetails();
      let paymentMethodId = serverState.payment_method_id;

      if (paymentMethodId) {
        await paymentMethodsApi.updatePaymentMethod(paymentMethodId, buildPaymentUpdatePayload());
      } else {
        const created = await paymentMethodsApi.createPaymentMethod(buildPaymentPayload());
        paymentMethodId = created.id;
      }

      await saveOnboardingProgress({
        current_step: "first_product",
        completed_steps: [...completedSteps, "payment_details"],
        payment_method_id: paymentMethodId,
        payment_details: {
          payment_method_id: paymentMethodId,
          type: drafts.paymentDetails.type,
          display_name: drafts.paymentDetails.displayName.trim(),
          card_number: drafts.paymentDetails.cardNumber.trim() || null,
          owner_name: drafts.paymentDetails.ownerName.trim() || null,
          wallet_address: drafts.paymentDetails.walletAddress.trim() || null,
          external_url: drafts.paymentDetails.externalUrl.trim() || null,
          instructions: drafts.paymentDetails.instructions.trim() || null,
          is_active: drafts.paymentDetails.isActive,
        },
        status: "IN_PROGRESS",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ذخیره جزئیات پرداخت ناموفق بود";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function continueFirstProduct() {
    setLoading(true);
    setError(null);
    try {
      if (serverState.first_product_id) {
        if (!drafts.firstProduct.title.trim()) {
          throw new Error("نام محصول را وارد کن.");
        }
        if (!isValidMoney(drafts.firstProduct.price)) {
          throw new Error("قیمت معتبر وارد کن.");
        }
        if (!drafts.firstProduct.imageUrl.trim()) {
          throw new Error("تصویر محصول لازم است.");
        }

        await productsApi.updateProduct(serverState.first_product_id, {
          title: drafts.firstProduct.title.trim(),
          description: drafts.firstProduct.description.trim() || null,
          price: moneyForApi(drafts.firstProduct.price),
          stock_quantity: drafts.firstProduct.stockQuantity || 1,
          is_active: true,
          images: [
            {
              image_url: drafts.firstProduct.imageUrl.trim(),
              thumbnail_url: drafts.firstProduct.thumbnailUrl.trim() || null,
              alt_text: drafts.firstProduct.title.trim(),
              sort_order: 0,
            },
          ],
        });

        await saveOnboardingProgress({
          current_step: "activation",
          completed_steps: [...completedSteps, "first_product"],
          first_product_id: serverState.first_product_id,
          first_product: {
            product_id: serverState.first_product_id,
            title: drafts.firstProduct.title.trim(),
            price: moneyForApi(drafts.firstProduct.price),
            description: drafts.firstProduct.description.trim() || null,
            image_url: drafts.firstProduct.imageUrl.trim() || null,
            thumbnail_url: drafts.firstProduct.thumbnailUrl.trim() || null,
            stock_quantity: drafts.firstProduct.stockQuantity || 1,
            is_active: true,
          },
          status: "IN_PROGRESS",
        });
        return;
      }

      if (!drafts.firstProduct.title.trim()) {
        throw new Error("نام محصول را وارد کنید.");
      }
      if (!isValidMoney(drafts.firstProduct.price)) {
        throw new Error("قیمت معتبر وارد کنید.");
      }
      if (!drafts.firstProduct.imageUrl.trim()) {
        throw new Error("تصویر محصول لازم است.");
      }

      const created = await productsApi.createProduct({
        title: drafts.firstProduct.title.trim(),
        description: drafts.firstProduct.description.trim() || null,
        price: moneyForApi(drafts.firstProduct.price),
        stock_quantity: drafts.firstProduct.stockQuantity || 1,
        is_active: true,
        images: [
          {
            image_url: drafts.firstProduct.imageUrl.trim(),
            thumbnail_url: drafts.firstProduct.thumbnailUrl.trim() || null,
            alt_text: drafts.firstProduct.title.trim(),
            sort_order: 0,
          },
        ],
      });

      await saveOnboardingProgress({
        current_step: "activation",
        completed_steps: [...completedSteps, "first_product"],
        first_product_id: created.id,
        first_product: {
          product_id: created.id,
          title: drafts.firstProduct.title.trim(),
          price: moneyForApi(drafts.firstProduct.price),
          description: drafts.firstProduct.description.trim() || null,
          image_url: drafts.firstProduct.imageUrl.trim() || null,
          thumbnail_url: drafts.firstProduct.thumbnailUrl.trim() || null,
          stock_quantity: drafts.firstProduct.stockQuantity || 1,
          is_active: true,
        },
        status: "IN_PROGRESS",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ایجاد اولین محصول ناموفق بود";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function finishActivation() {
    setLoading(true);
    setError(null);
    try {
      const canComplete =
        Boolean(serverState.first_product_id) &&
        Boolean(serverState.payment_method_id) &&
        Boolean(drafts.storeIdentity.name.trim()) &&
        Boolean(drafts.storeInformation.description.trim()) &&
        Boolean(drafts.storeInformation.categorySlug.trim());
      await saveOnboardingProgress({
        current_step: "activation",
        completed_steps: canComplete
          ? [
              "welcome",
              "store_identity",
              "store_information",
              "contact_channels",
              "payment_details",
              "first_product",
              "activation",
            ]
          : completedSteps,
        status: canComplete ? "COMPLETED" : "IN_PROGRESS",
      });
      if (!canComplete) {
        toast.success("پیشرفتت ذخیره شد؛ هر وقت خواستی از داشبورد ادامه بده");
        router.replace(paths.seller.dashboard);
        return;
      }
      toast.success("عالی! فروشگاهت آماده‌ست");
      router.replace(paths.seller.dashboard);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "پایان راه‌اندازی ناموفق بود";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const currentChecklist = useMemo(
    () => [
      { label: "نام فروشگاه ثبت شد", done: Boolean(drafts.storeIdentity.name.trim()) },
      {
        label: "پروفایل تکمیل شد",
        done:
          Boolean(drafts.storeInformation.description.trim()) &&
          Boolean(drafts.storeInformation.categorySlug.trim()),
      },
      {
        label: "راه‌های ارتباطی (اختیاری)",
        done: drafts.contactChannels.some((link) => link.url.trim()),
      },
      {
        label: "جزئیات پرداخت ثبت شد",
        done: Boolean(serverState.payment_method_id),
      },
      { label: "اولین محصول اضافه شد", done: Boolean(serverState.first_product_id) },
    ],
    [
      drafts.storeIdentity,
      drafts.storeInformation,
      drafts.contactChannels,
      serverState.first_product_id,
      serverState.payment_method_id,
    ],
  );

  function renderPreview() {
    switch (activeStep.key) {
      case "welcome":
      case "activation":
        return null;
      case "store_identity":
        return (
          <Card className="overflow-hidden border-border bg-surface shadow-sm">
            <div className="h-40 bg-gradient-to-br from-brand/30 via-brand/10 to-transparent">
              {(drafts.storeIdentity.coverImageUrl || coverPreview) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreview ?? resolveMediaUrl(drafts.storeIdentity.coverImageUrl) ?? drafts.storeIdentity.coverImageUrl}
                  alt="پیش‌نمایش جلد"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <CardContent className="flex items-start gap-3">
              <div className="-mt-12 rounded-3xl border border-border bg-surface p-2 shadow-lg">
                {drafts.storeIdentity.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview ?? resolveMediaUrl(drafts.storeIdentity.logoUrl) ?? drafts.storeIdentity.logoUrl}
                    alt="لوگو"
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-muted text-2xl font-semibold text-foreground-muted">
                    {drafts.storeIdentity.name.trim().charAt(0) || "ن"}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 pt-3">
                <p className="text-lg font-semibold text-foreground">{drafts.storeIdentity.name || "نام فروشگاه"}</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  {drafts.storeInformation.description || "توضیحات فروشگاه اینجا دیده می‌شود."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StepBadge done={Boolean(drafts.storeInformation.categorySlug)} label={drafts.storeInformation.categoryName || "دسته‌بندی"} />
                  <StepBadge done={Boolean(drafts.contactChannels.length)} label="راه‌های ارتباطی" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case "store_information":
        return (
          <Card className="border-border bg-surface shadow-sm">
            <CardContent className="space-y-4 py-6">
              <div>
                <p className="text-xs tracking-[0.2em] text-foreground-muted">اطلاعات فروشگاه</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{drafts.storeIdentity.name || "نام فروشگاه"}</p>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                  {drafts.storeInformation.description || "یک توضیح کوتاه و حرفه‌ای درباره فروشگاه خود بنویسید."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StepBadge done={Boolean(drafts.storeInformation.categorySlug)} label={drafts.storeInformation.categoryName || "بدون دسته‌بندی"} />
                <StepBadge done={Boolean(drafts.storeInformation.location)} label={drafts.storeInformation.location || "موقعیت اختیاری"} />
              </div>
            </CardContent>
          </Card>
        );
      case "contact_channels":
        return (
          <Card className="border-border bg-surface shadow-sm">
            <CardContent className="space-y-4 py-6">
              <p className="text-xs tracking-[0.2em] text-foreground-muted">راه‌های ارتباطی</p>
              {drafts.contactChannels.length === 0 ? (
                <EmptyState title="هنوز کانالی اضافه نشده" description="چند راه ارتباطی اضافه کنید تا مشتری سریع‌تر شما را پیدا کند." />
              ) : (
                <div className="space-y-3">
                  {drafts.contactChannels.map((link, index) => (
                    <div
                      key={`${index}-${link.platform}-${link.url}`}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted/40 px-3 py-3"
                    >
                      <SocialIcon platform={link.platform} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{makeSocialLinkLabel(link.platform, link.customLabel)}</p>
                        <p className="truncate text-xs text-foreground-muted">{link.url || "نشانی هنوز ثبت نشده"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      case "payment_details":
        return (
          <Card className="border-border bg-surface shadow-sm">
            <CardContent className="space-y-4 py-6">
              <p className="text-xs tracking-[0.2em] text-foreground-muted">روش پرداخت</p>
              <div className="rounded-2xl border border-border bg-surface-muted/40 px-4 py-4">
                <p className="text-sm font-medium text-foreground">
                  {drafts.paymentDetails.displayName || "نام روش پرداخت"}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  {paymentTypeLabel(drafts.paymentDetails.type)}
                </p>
                {drafts.paymentDetails.type === "CARD_TO_CARD" && (
                  <div className="mt-3 space-y-1 text-sm text-foreground-muted">
                    <p>{drafts.paymentDetails.cardNumber || "شماره کارت"}</p>
                    <p>{drafts.paymentDetails.ownerName || "نام صاحب حساب"}</p>
                  </div>
                )}
                {drafts.paymentDetails.type === "CRYPTO" && (
                  <p className="mt-3 break-all text-sm text-foreground-muted">
                    {drafts.paymentDetails.walletAddress || "آدرس کیف پول"}
                  </p>
                )}
                {drafts.paymentDetails.type === "EXTERNAL_GATEWAY" && (
                  <p className="mt-3 break-all text-sm text-foreground-muted">
                    {drafts.paymentDetails.externalUrl || "نشانی درگاه"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      case "first_product":
        return (
          <Card className="border-border bg-surface shadow-sm">
            <CardContent className="space-y-4 py-6">
              <p className="text-xs tracking-[0.2em] text-foreground-muted">اولین محصول</p>
              <div className="overflow-hidden rounded-3xl border border-border bg-surface-muted">
                {drafts.firstProduct.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={productPreview ?? resolveMediaUrl(drafts.firstProduct.imageUrl) ?? drafts.firstProduct.imageUrl}
                    alt="پیش‌نمایش محصول"
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center text-sm text-foreground-muted">تصویر محصول اینجا دیده می‌شود</div>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{drafts.firstProduct.title || "نام محصول"}</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  {drafts.firstProduct.description || "توضیح کوتاه محصول را وارد کنید."}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
                    {drafts.firstProduct.price
                      ? formatMoney(moneyForApi(drafts.firstProduct.price))
                      : "قیمت"}
                  </span>
                  <span className="rounded-full bg-surface-muted px-3 py-1 text-sm text-foreground-muted">
                    {drafts.firstProduct.stockQuantity || 1} موجود
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  }

  function renderStep() {
    switch (activeStep.key) {
      case "welcome":
        return (
          <Card className="border-border bg-surface shadow-sm">
            <CardContent className="space-y-5 py-8">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{activeStep.title}</h1>
                {activeStep.description && (
                  <p className="max-w-xl text-sm leading-6 text-foreground-muted">{activeStep.description}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={() => void continueWelcome()} loading={loading}>
                  شروع
                </Button>
                <Button type="button" variant="secondary" onClick={() => void skipWelcome()} loading={loading}>
                  بعداً
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case "store_identity":
        return (
          <Card className="border-border bg-surface shadow-sm">
            <CardContent className="space-y-6 py-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{activeStep.title}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="نام فروشگاه"
                  value={drafts.storeIdentity.name}
                  onChange={(e) =>
                    markDraftChange((current) => ({
                      ...current,
                      storeIdentity: { ...current.storeIdentity, name: e.target.value },
                    }))
                  }
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">لوگو</label>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      const uploaded = await uploadImageWithPreview(file, setLogoPreview);
                      markDraftChange((current) => ({
                        ...current,
                        storeIdentity: {
                          ...current.storeIdentity,
                          logoUrl: uploaded.url,
                        },
                      }));
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "بارگذاری لوگو ناموفق بود";
                      setError(msg);
                      toast.error(msg);
                    } finally {
                      event.target.value = "";
                    }
                  }} />
                  <div className="overflow-hidden rounded-3xl border border-dashed border-border bg-surface-muted">
                    {drafts.storeIdentity.logoUrl || logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoPreview ?? resolveMediaUrl(drafts.storeIdentity.logoUrl) ?? drafts.storeIdentity.logoUrl}
                        alt="پیش‌نمایش لوگو"
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center text-sm text-foreground-muted">لوگو اینجا نمایش داده می‌شود</div>
                    )}
                  </div>
                  <Button type="button" variant="secondary" onClick={() => logoInputRef.current?.click()}>
                    {drafts.storeIdentity.logoUrl ? "تعویض لوگو" : "بارگذاری لوگو"}
                  </Button>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-foreground">تصویر روی جلد</label>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      const uploaded = await uploadImageWithPreview(file, setCoverPreview);
                      markDraftChange((current) => ({
                        ...current,
                        storeIdentity: {
                          ...current.storeIdentity,
                          coverImageUrl: uploaded.url,
                        },
                      }));
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "بارگذاری تصویر جلد ناموفق بود";
                      setError(msg);
                      toast.error(msg);
                    } finally {
                      event.target.value = "";
                    }
                  }} />
                  <div className="overflow-hidden rounded-3xl border border-dashed border-border bg-surface-muted">
                    {drafts.storeIdentity.coverImageUrl || coverPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverPreview ?? resolveMediaUrl(drafts.storeIdentity.coverImageUrl) ?? drafts.storeIdentity.coverImageUrl}
                        alt="پیش‌نمایش جلد"
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center text-sm text-foreground-muted">
                        تصویر جلد اختیاری است و در پروفایل فروشگاه نمایش داده می‌شود
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="secondary" onClick={() => coverInputRef.current?.click()}>
                    {drafts.storeIdentity.coverImageUrl ? "تعویض تصویر جلد" : "بارگذاری تصویر جلد"}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={() => void moveStep(-1)}>
                  بازگشت
                </Button>
                <Button type="button" onClick={() => void continueStoreIdentity()} loading={loading}>
                  ذخیره و ادامه
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case "store_information":
        return (
          <Card className="border-border bg-surface shadow-sm">
            <CardContent className="space-y-6 py-6">
              <div>
                <p className="text-xs tracking-[0.2em] text-foreground-muted">{activeStep.title}</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">اطلاعات فروشگاه را کامل کنید</h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{activeStep.helper}</p>
              </div>
              <Textarea
                label="توضیحات فروشگاه"
                value={drafts.storeInformation.description}
                onChange={(e) =>
                  markDraftChange((current) => ({
                    ...current,
                    storeInformation: { ...current.storeInformation, description: e.target.value },
                  }))
                }
                rows={5}
                hint="چند جمله کوتاه و روشن، اعتماد مشتری را بیشتر می‌کند."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 md:col-span-2">
                  <p className="text-sm font-medium text-foreground">دسته‌بندی فروشگاه</p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {data.categories.map((category) => {
                      const selected = drafts.storeInformation.categorySlug === category.slug;
                      return (
                        <button
                          key={category.slug}
                          type="button"
                          onClick={() =>
                            markDraftChange((current) => ({
                              ...current,
                              storeInformation: {
                                ...current.storeInformation,
                                categorySlug: category.slug,
                                categoryName: category.label,
                              },
                            }))
                          }
                          className={cn(
                            "rounded-3xl border p-4 text-right transition-colors",
                            selected
                              ? "border-brand bg-brand/5 shadow-sm"
                              : "border-border bg-surface hover:border-brand/40 hover:bg-surface-muted",
                          )}
                        >
                          <p className="text-sm font-semibold text-foreground">{category.label}</p>
                          <p className="mt-1 text-xs text-foreground-muted">{category.query}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {drafts.storeInformation.categorySlug === "other" && (
                  <Input
                    label="دسته‌بندی سفارشی"
                    value={drafts.storeInformation.categoryName}
                    onChange={(e) =>
                      markDraftChange((current) => ({
                        ...current,
                        storeInformation: { ...current.storeInformation, categoryName: e.target.value },
                      }))
                    }
                    hint="اگر دسته‌بندی شما در فهرست نیست، یک عنوان کوتاه بنویسید."
                    className="md:col-span-2"
                  />
                )}
                <Input
                  label="موقعیت"
                  value={drafts.storeInformation.location}
                  onChange={(e) =>
                    markDraftChange((current) => ({
                      ...current,
                      storeInformation: { ...current.storeInformation, location: e.target.value },
                    }))
                  }
                  hint="اختیاری است، اما به اعتماد و شفافیت کمک می‌کند."
                  className="md:col-span-2"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={() => void moveStep(-1)}>
                  بازگشت
                </Button>
                <Button type="button" onClick={() => void continueStoreInformation()} loading={loading}>
                  ذخیره و ادامه
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case "contact_channels":
        return (
          <Card className="border-border bg-surface shadow-sm">
            <CardContent className="space-y-6 py-6">
              <div>
                <p className="text-xs tracking-[0.2em] text-foreground-muted">{activeStep.title}</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">راه‌های ارتباطی مشتری را اضافه کنید</h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{activeStep.helper}</p>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    markDraftChange((current) => ({
                      ...current,
                      contactChannels: [...current.contactChannels, blankContactLink()],
                    }))
                  }
                >
                  {drafts.contactChannels.length === 0 ? "افزودن لینک" : "افزودن لینک دیگر"}
                </Button>
                <p className="text-xs text-foreground-muted">
                  بعد از هر لینک، برای لینک بعدی همین دکمه را بزن. وقتی تمام شد، ذخیره و ادامه.
                </p>
              </div>

              <div className="space-y-3">
                {drafts.contactChannels.length === 0 ? (
                  <EmptyState
                    title="هنوز کانالی اضافه نشده"
                    description="می‌توانید این مرحله را رد کنید و بعداً از داشبورد تکمیلش کنید."
                    action={
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          markDraftChange((current) => ({
                            ...current,
                            contactChannels: [...current.contactChannels, blankContactLink()],
                          }))
                        }
                      >
                        افزودن اولین لینک
                      </Button>
                    }
                  />
                ) : (
                  drafts.contactChannels.map((link, index) => (
                    <div key={`${index}-${link.platform}`} className="rounded-3xl border border-border p-4">
                      <div className="flex items-start gap-3">
                        <SocialIcon platform={link.platform} />
                        <div className="min-w-0 flex-1 space-y-3">
                          <Select
                            label="پلتفرم"
                            value={link.platform}
                            onChange={(e) =>
                              markDraftChange((current) => ({
                                ...current,
                                contactChannels: current.contactChannels.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, platform: e.target.value as SocialPlatformKey } : item,
                                ),
                              }))
                            }
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
                              onChange={(e) =>
                                markDraftChange((current) => ({
                                  ...current,
                                  contactChannels: current.contactChannels.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, customLabel: e.target.value } : item,
                                  ),
                                }))
                              }
                              hint="مثلاً پشتیبانی، فروش یا پاسخ‌گویی"
                            />
                          )}
                          <Input
                            label="نشانی یا شناسه"
                            type={link.platform === "email" ? "email" : "text"}
                            value={link.url}
                            placeholder={socialInputPlaceholder(link.platform)}
                            hint={socialInputHint(link.platform)}
                            onChange={(e) =>
                              markDraftChange((current) => ({
                                ...current,
                                contactChannels: current.contactChannels.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, url: e.target.value } : item,
                                ),
                              }))
                            }
                          />
                          <label className="flex items-center gap-2 text-sm text-foreground">
                            <input
                              type="checkbox"
                              checked={link.is_active}
                              onChange={(e) =>
                                markDraftChange((current) => ({
                                  ...current,
                                  contactChannels: current.contactChannels.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, is_active: e.target.checked } : item,
                                  ),
                                }))
                              }
                            />
                            فعال
                          </label>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            markDraftChange((current) => {
                              const target = index - 1;
                              if (target < 0) return current;
                              const next = [...current.contactChannels];
                              [next[index], next[target]] = [next[target], next[index]];
                              return { ...current, contactChannels: next };
                            })
                          }
                          disabled={index === 0}
                        >
                          بالا
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            markDraftChange((current) => {
                              const target = index + 1;
                              if (target >= current.contactChannels.length) return current;
                              const next = [...current.contactChannels];
                              [next[index], next[target]] = [next[target], next[index]];
                              return { ...current, contactChannels: next };
                            })
                          }
                          disabled={index === drafts.contactChannels.length - 1}
                        >
                          پایین
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          onClick={() =>
                            markDraftChange((current) => ({
                              ...current,
                              contactChannels: current.contactChannels.filter((_, itemIndex) => itemIndex !== index),
                            }))
                          }
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                <Button type="button" variant="secondary" onClick={() => void moveStep(-1)}>
                  بازگشت
                </Button>
                <Button type="button" onClick={() => void continueContactChannels()} loading={loading}>
                  ذخیره و ادامه
                </Button>
                <Button type="button" variant="ghost" onClick={() => void skipContactChannels()} loading={loading}>
                  رد کردن این مرحله
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case "payment_details":
        return (
          <Card className="border-border bg-surface shadow-sm">
            <CardContent className="space-y-6 py-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{activeStep.title}</h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{activeStep.helper}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-sm font-medium text-foreground">نوع پرداخت</label>
                  <select
                    value={drafts.paymentDetails.type}
                    onChange={(e) =>
                      markDraftChange((current) => ({
                        ...current,
                        paymentDetails: {
                          ...current.paymentDetails,
                          type: e.target.value as PaymentMethodType,
                        },
                      }))
                    }
                    className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <option value="CARD_TO_CARD">کارت‌به‌کارت</option>
                    <option value="CRYPTO">رمزارز</option>
                    <option value="EXTERNAL_GATEWAY">درگاه خارجی</option>
                  </select>
                </div>
                <Input
                  label="نام نمایشی"
                  value={drafts.paymentDetails.displayName}
                  onChange={(e) =>
                    markDraftChange((current) => ({
                      ...current,
                      paymentDetails: { ...current.paymentDetails, displayName: e.target.value },
                    }))
                  }
                  hint="مثلاً کارت ملت یا تتر"
                  className="md:col-span-2"
                />
                {drafts.paymentDetails.type === "CARD_TO_CARD" && (
                  <>
                    <Input
                      label="شماره کارت"
                      value={drafts.paymentDetails.cardNumber}
                      onChange={(e) =>
                        markDraftChange((current) => ({
                          ...current,
                          paymentDetails: { ...current.paymentDetails, cardNumber: e.target.value },
                        }))
                      }
                    />
                    <Input
                      label="نام صاحب حساب"
                      value={drafts.paymentDetails.ownerName}
                      onChange={(e) =>
                        markDraftChange((current) => ({
                          ...current,
                          paymentDetails: { ...current.paymentDetails, ownerName: e.target.value },
                        }))
                      }
                    />
                  </>
                )}
                {drafts.paymentDetails.type === "CRYPTO" && (
                  <Input
                    label="آدرس کیف پول"
                    value={drafts.paymentDetails.walletAddress}
                    onChange={(e) =>
                      markDraftChange((current) => ({
                        ...current,
                        paymentDetails: { ...current.paymentDetails, walletAddress: e.target.value },
                      }))
                    }
                    className="md:col-span-2"
                  />
                )}
                {drafts.paymentDetails.type === "EXTERNAL_GATEWAY" && (
                  <Input
                    label="نشانی درگاه"
                    type="url"
                    value={drafts.paymentDetails.externalUrl}
                    onChange={(e) =>
                      markDraftChange((current) => ({
                        ...current,
                        paymentDetails: { ...current.paymentDetails, externalUrl: e.target.value },
                      }))
                    }
                    className="md:col-span-2"
                  />
                )}
                <Textarea
                  label="توضیحات برای مشتری"
                  value={drafts.paymentDetails.instructions}
                  onChange={(e) =>
                    markDraftChange((current) => ({
                      ...current,
                      paymentDetails: { ...current.paymentDetails, instructions: e.target.value },
                    }))
                  }
                  rows={3}
                  className="md:col-span-2"
                  hint="مثلاً بعد از واریز، رسید را در سفارش بارگذاری کنید."
                />
              </div>
              <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                <Button type="button" variant="secondary" onClick={() => void moveStep(-1)}>
                  بازگشت
                </Button>
                <Button type="button" onClick={() => void continuePaymentDetails()} loading={loading}>
                  {serverState.payment_method_id ? "به‌روزرسانی و ادامه" : "ذخیره و ادامه"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case "first_product":
        return (
          <Card className="border-border bg-surface shadow-sm">
            <CardContent className="space-y-6 py-6">
              <div>
                <p className="text-xs tracking-[0.2em] text-foreground-muted">{activeStep.title}</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">اولین محصول را منتشر کنید</h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{activeStep.helper}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="نام محصول"
                  value={drafts.firstProduct.title}
                  onChange={(e) =>
                    markDraftChange((current) => ({
                      ...current,
                      firstProduct: { ...current.firstProduct, title: e.target.value },
                    }))
                  }
                />
                <MoneyInput
                  label="قیمت"
                  value={drafts.firstProduct.price}
                  onValueChange={(next) =>
                    markDraftChange((current) => ({
                      ...current,
                      firstProduct: { ...current.firstProduct, price: next },
                    }))
                  }
                  hint="فروشگاه‌ها وقتی محصول اول سریع منتشر می‌شود، زودتر فعال می‌شوند."
                />
                <Textarea
                  label="توضیحات محصول"
                  value={drafts.firstProduct.description}
                  onChange={(e) =>
                    markDraftChange((current) => ({
                      ...current,
                      firstProduct: { ...current.firstProduct, description: e.target.value },
                    }))
                  }
                  rows={4}
                  className="md:col-span-2"
                />
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-foreground">تصویر محصول</label>
                  <input ref={productImageInputRef} type="file" accept="image/*" className="hidden" onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      const uploaded = await uploadImageWithPreview(file, setProductPreview);
                      markDraftChange((current) => ({
                        ...current,
                        firstProduct: {
                          ...current.firstProduct,
                          imageUrl: uploaded.url,
                          thumbnailUrl: uploaded.thumbnail_url ?? uploaded.url,
                        },
                      }));
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "بارگذاری تصویر محصول ناموفق بود";
                      setError(msg);
                      toast.error(msg);
                    } finally {
                      event.target.value = "";
                    }
                  }} />
                  <div className="overflow-hidden rounded-3xl border border-dashed border-border bg-surface-muted">
                    {drafts.firstProduct.imageUrl || productPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={productPreview ?? resolveMediaUrl(drafts.firstProduct.imageUrl) ?? drafts.firstProduct.imageUrl}
                        alt="پیش‌نمایش محصول"
                        className="h-52 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center text-sm text-foreground-muted">
                        تصویر محصول برای انتشار محصول لازم است
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="secondary" onClick={() => productImageInputRef.current?.click()}>
                    {drafts.firstProduct.imageUrl ? "تعویض تصویر" : "بارگذاری تصویر"}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={() => void moveStep(-1)}>
                  بازگشت
                </Button>
                <Button type="button" onClick={() => void continueFirstProduct()} loading={loading}>
                  {serverState.first_product_id ? "ادامه" : "ذخیره و ادامه"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case "activation":
        return (
          <Card className="border-border bg-surface shadow-sm">
            <CardContent className="space-y-5 py-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{activeStep.title}</h2>
                {activeStep.description && (
                  <p className="mt-1 text-sm text-foreground-muted">{activeStep.description}</p>
                )}
              </div>
              <div className="space-y-2">
                {currentChecklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                    <span className={cn("h-2.5 w-2.5 rounded-full", item.done ? "bg-emerald-500" : "bg-border")} />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={() => void moveStep(-1)}>
                  بازگشت
                </Button>
                <Button type="button" onClick={() => void finishActivation()} loading={loading}>
                  رفتن به داشبورد
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  }

  if (hasCompletedOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <Card className="max-w-xl border-border bg-surface shadow-sm">
          <CardContent className="space-y-4 py-8">
            <p className="text-xs tracking-[0.2em] text-foreground-muted">همه‌چیز روبه‌راه است</p>
            <h1 className="text-3xl font-semibold text-foreground">فروشگاهت از قبل راه افتاده</h1>
            <p className="text-sm leading-6 text-foreground-muted">
              برو داشبورد و سفارش‌ها، محصولات و گفتگوها را از آنجا مدیریت کن.
            </p>
            <Button type="button" onClick={() => router.replace(paths.seller.dashboard)}>
              رفتن به داشبورد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl dark:bg-brand/15" />
        <div className="absolute -right-16 top-40 h-72 w-72 rounded-full bg-accent/10 blur-3xl dark:bg-fuchsia-500/10" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-brand/5 blur-3xl dark:bg-brand/10" />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6">
        <div className="rounded-[2rem] border border-border bg-surface/90 p-5 shadow-sm backdrop-blur-xl">
          <div className="mb-5">
            <BrandMark showTagline />
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{activeStep.title}</h1>
              {activeStep.description ? (
                <p className="max-w-xl text-sm text-foreground-muted">{activeStep.description}</p>
              ) : null}
            </div>
            <div className="min-w-[220px] space-y-3 rounded-3xl border border-border bg-surface-muted/60 p-4">
              <div className="flex items-center justify-between text-sm text-foreground-muted">
                <span>پیشرفت</span>
                <span>{progressPercent}%</span>
              </div>
              <ProgressBar current={activeStepIndex} total={STEP_ORDER.length} />
              <p className="text-xs text-foreground-muted">{savingNote}</p>
            </div>
          </div>
        </div>

        {error && <ErrorAlert message={error} />}

        <div className="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <div className="space-y-6">{renderStep()}</div>
          <div className="space-y-6">
            {renderPreview()}
            <Card className="border-border bg-surface shadow-sm">
              <CardContent className="space-y-3 py-5">
                <p className="text-xs tracking-[0.2em] text-foreground-muted">مراحل</p>
                <div className="flex flex-wrap gap-2">
                  {STEP_ORDER.map((step) => {
                    const active = step.key === activeStep.key;
                    const done = completedSteps.includes(step.key);
                    return <StepBadge key={step.key} label={step.title} active={active} done={done} />;
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
