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
    title: "شروع",
    description: "تو چند قدم کوتاه، فروشگاهت رو آماده می‌کنیم.",
    helper: "هر وقت خواستی، می‌تونی بعداً ادامه بدی.",
  },
  {
    key: "store_identity",
    title: "نام و ظاهر",
    description: "نام فروشگاه، لوگو و تصویر جلد.",
    helper: "بعداً هم از تنظیمات می‌تونی عوضش کنی.",
  },
  {
    key: "store_information",
    title: "معرفی فروشگاه",
    description: "توضیح کوتاه و دسته‌بندی.",
    helper: "معرفی روشن، اعتماد مشتری رو بیشتر می‌کنه.",
  },
  {
    key: "contact_channels",
    title: "راه‌های ارتباطی",
    description: "اینستاگرام، تلگرام و راه‌های دیگر (اختیاری).",
    helper: "می‌تونی این مرحله رو رد کنی.",
  },
  {
    key: "payment_details",
    title: "روش پرداخت",
    description: "کارت، رمزارز یا درگاه، برای دریافت پول.",
    helper: "تا روش پرداخت نداشته باشی، مشتری نمی‌تونه خرید رو تمام کنه.",
  },
  {
    key: "first_product",
    title: "اولین محصول",
    description: "یک محصول با عکس و قیمت.",
    helper: "بقیه محصول‌ها رو بعداً اضافه می‌کنی.",
  },
  {
    key: "activation",
    title: "پایان",
    description: "چک‌لیست رو ببین و برو داشبورد.",
    helper: "کارهای باقی‌مونده رو بعداً از داشبورد تمام کن.",
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

function StepNav({
  steps,
  activeKey,
  completed,
  onSelect,
}: {
  steps: StepMeta[];
  activeKey: SellerOnboardingStepKey;
  completed: SellerOnboardingStepKey[];
  onSelect: (key: SellerOnboardingStepKey) => void;
}) {
  return (
    <nav aria-label="مراحل راه‌اندازی" className="space-y-1">
      {steps.map((step, index) => {
        const active = step.key === activeKey;
        const done = completed.includes(step.key);
        const prevKey = index > 0 ? steps[index - 1]?.key : null;
        const reachable = index === 0 || done || active || (prevKey ? completed.includes(prevKey) : false);

        return (
          <button
            key={step.key}
            type="button"
            disabled={!reachable}
            onClick={() => onSelect(step.key)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition",
              active
                ? "bg-brand/10 text-foreground ring-1 ring-brand/25"
                : reachable
                  ? "text-foreground hover:bg-surface-muted"
                  : "cursor-not-allowed text-foreground-muted/50",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                done
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-brand text-white"
                    : "bg-surface-muted text-foreground-muted",
              )}
            >
              {done ? "✓" : index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium leading-tight">{step.title}</span>
              {active ? (
                <span className="mt-0.5 block text-[11px] leading-snug text-foreground-muted">
                  {step.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </nav>
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
  const [savingNote, setSavingNote] = useState<string | null>("تغییراتت خودکار ذخیره می‌شه");
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
          setSavingNote("داره ذخیره می‌شه…");
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
          setSavingNote("ذخیره نشد؛ یه بار دیگه امتحان کن");
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
      const msg = err instanceof Error ? err.message : "این مرحله ذخیره نشد. دوباره امتحان کن.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function goToStep(targetStep: SellerOnboardingStepKey) {
    if (targetStep === activeStep.key) return;
    setLoading(true);
    setError(null);
    try {
      await saveOnboardingProgress(buildNavigationPayload(targetStep));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "به مرحله بعد نرفت. دوباره امتحان کن.";
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
      const msg = err instanceof Error ? err.message : "راه‌اندازی شروع نشد. دوباره امتحان کن.";
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
      const msg = err instanceof Error ? err.message : "ذخیره نشد. دوباره امتحان کن.";
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
        throw new Error("نام فروشگاه رو وارد کن.");
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
      const msg = err instanceof Error ? err.message : "نام و ظاهر فروشگاه ذخیره نشد. دوباره امتحان کن.";
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
        throw new Error("چند جمله درباره فروشگاه بنویس.");
      }
      if (!drafts.storeInformation.categorySlug.trim()) {
        throw new Error("دسته‌بندی فروشگاه رو انتخاب کن.");
      }
      if (drafts.storeInformation.categorySlug === "other" && !drafts.storeInformation.categoryName.trim()) {
        throw new Error("نام دسته‌بندی دلخواه رو بنویس.");
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
      const msg = err instanceof Error ? err.message : "معرفی فروشگاه ذخیره نشد. دوباره امتحان کن.";
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
        throw new Error("برای لینکی که برچسب دلخواه داره، یه عنوان بنویس.");
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
      const msg = err instanceof Error ? err.message : "راه‌های ارتباطی ذخیره نشد. دوباره امتحان کن.";
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
      const msg = err instanceof Error ? err.message : "ذخیره نشد. دوباره امتحان کن.";
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
      throw new Error("برای روش پرداخت یه اسم بنویس؛ مثلاً «کارت ملت».");
    }
    if (drafts.paymentDetails.type === "CARD_TO_CARD") {
      if (!drafts.paymentDetails.cardNumber.trim()) {
        throw new Error("شماره کارت رو وارد کن.");
      }
      if (!drafts.paymentDetails.ownerName.trim()) {
        throw new Error("نام صاحب حساب رو وارد کن.");
      }
    } else if (drafts.paymentDetails.type === "CRYPTO") {
      if (!drafts.paymentDetails.walletAddress.trim()) {
        throw new Error("آدرس کیف پول رو وارد کن.");
      }
    } else if (!drafts.paymentDetails.externalUrl.trim()) {
      throw new Error("نشانی درگاه رو وارد کن.");
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
      const msg = err instanceof Error ? err.message : "اطلاعات پرداخت ذخیره نشد. دوباره امتحان کن.";
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
          throw new Error("نام محصول رو وارد کن.");
        }
        if (!isValidMoney(drafts.firstProduct.price)) {
          throw new Error("قیمت رو درست وارد کن.");
        }
        if (!drafts.firstProduct.imageUrl.trim()) {
          throw new Error("یه عکس از محصول بذار.");
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
        throw new Error("نام محصول رو وارد کن.");
      }
      if (!isValidMoney(drafts.firstProduct.price)) {
        throw new Error("قیمت رو درست وارد کن.");
      }
      if (!drafts.firstProduct.imageUrl.trim()) {
        throw new Error("یه عکس از محصول بذار.");
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
      const msg = err instanceof Error ? err.message : "محصول ساخته نشد. دوباره امتحان کن.";
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
        toast.success("کارهات ذخیره شد؛ هر وقت خواستی، از داشبورد ادامه بده");
        router.replace(paths.seller.dashboard);
        return;
      }
      toast.success("فروشگاهت آماده‌ست!");
      router.replace(paths.seller.dashboard);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "راه‌اندازی تمام نشد. دوباره امتحان کن.";
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
        label: "معرفی فروشگاه کامل شد",
        done:
          Boolean(drafts.storeInformation.description.trim()) &&
          Boolean(drafts.storeInformation.categorySlug.trim()),
      },
      {
        label: "راه‌های ارتباطی (اختیاری)",
        done: drafts.contactChannels.some((link) => link.url.trim()),
      },
      {
        label: "روش پرداخت ثبت شد",
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

  function renderStep() {
    switch (activeStep.key) {
      case "welcome":
        return (
          <div className="space-y-5 rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <p className="max-w-lg text-sm leading-6 text-foreground-muted">
              چند دقیقه بیشتر طول نمی‌کشه و هر مرحله همون لحظه ذخیره می‌شه.
            </p>
            <ul className="space-y-2 text-sm text-foreground">
              {STEP_ORDER.slice(1, -1).map((step, i) => (
                <li key={step.key} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-foreground-muted">
                    {i + 1}
                  </span>
                  <span>{step.title}</span>
                  {step.key === "contact_channels" ? (
                    <span className="text-xs text-foreground-muted">(اختیاری)</span>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button type="button" onClick={() => void continueWelcome()} loading={loading}>
                بزن بریم
              </Button>
              <Button type="button" variant="ghost" onClick={() => void skipWelcome()} loading={loading}>
                فعلاً نه
              </Button>
            </div>
          </div>
        );
      case "store_identity":
        return (
          <Card className="border-border bg-surface shadow-sm">
            <CardContent className="space-y-5 py-5 sm:py-6">
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
                      const msg = err instanceof Error ? err.message : "لوگو بارگذاری نشد. دوباره امتحان کن.";
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
                      <div className="flex h-44 items-center justify-center text-sm text-foreground-muted">لوگو اینجا نشون داده می‌شه</div>
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
                      const msg = err instanceof Error ? err.message : "تصویر جلد بارگذاری نشد. دوباره امتحان کن.";
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
                        تصویر جلد اختیاریه و بالای صفحه فروشگاه نشون داده می‌شه
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
            <CardContent className="space-y-5 py-5 sm:py-6">
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
                hint="چند جمله کوتاه بنویس: چی می‌فروشی و چرا ازت بخرن."
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
                            "rounded-xl border px-3 py-2.5 text-start text-sm font-medium transition-colors",
                            selected
                              ? "border-brand bg-brand/10 text-foreground ring-1 ring-brand/25"
                              : "border-border bg-surface text-foreground-muted hover:border-brand/40 hover:text-foreground",
                          )}
                        >
                          {category.label}
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
                    hint="اگر دسته‌بندیت تو فهرست نیست، اسمش رو کوتاه بنویس."
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
                  hint="اختیاریه، ولی مشتری‌ها به فروشگاهی که شهرش معلومه بیشتر اعتماد می‌کنن."
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
            <CardContent className="space-y-5 py-5 sm:py-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-foreground-muted">اختیاریه؛ می‌تونی رد کنی.</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    markDraftChange((current) => ({
                      ...current,
                      contactChannels: [...current.contactChannels, blankContactLink()],
                    }))
                  }
                >
                  {drafts.contactChannels.length === 0 ? "افزودن لینک" : "لینک دیگر"}
                </Button>
              </div>

              <div className="space-y-3">
                {drafts.contactChannels.length === 0 ? (
                  <EmptyState
                    title="هنوز راه ارتباطی اضافه نکردی"
                    description="می‌تونی این مرحله رو رد کنی و بعداً از داشبورد اضافه کنی."
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
                              hint="مثلاً پشتیبانی یا سفارش"
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
            <CardContent className="space-y-5 py-5 sm:py-6">
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
                    <option value="EXTERNAL_GATEWAY">درگاه پرداخت</option>
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
                  hint="مثلاً: بعد از واریز، عکس رسید رو تو صفحه سفارش بارگذاری کن."
                />
              </div>
              <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                <Button type="button" variant="secondary" onClick={() => void moveStep(-1)}>
                  بازگشت
                </Button>
                <Button type="button" onClick={() => void continuePaymentDetails()} loading={loading}>
                  {serverState.payment_method_id ? "ذخیره تغییرات و ادامه" : "ذخیره و ادامه"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case "first_product":
        return (
          <Card className="border-border bg-surface shadow-sm">
            <CardContent className="space-y-5 py-5 sm:py-6">
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
                  hint="همین یه محصول کافیه تا فروشگاه برای مشتری‌ها قابل خرید بشه."
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
                      const msg = err instanceof Error ? err.message : "عکس محصول بارگذاری نشد. دوباره امتحان کن.";
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
                        برای نمایش محصول، یه عکس لازم است
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
            <CardContent className="space-y-5 py-5 sm:py-6">
              <div className="space-y-2">
                {currentChecklist.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                      item.done ? "border-emerald-500/30 bg-emerald-500/5" : "border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                        item.done ? "bg-emerald-500 text-white" : "bg-surface-muted text-foreground-muted",
                      )}
                    >
                      {item.done ? "✓" : "·"}
                    </span>
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={() => void moveStep(-1)}>
                  بازگشت
                </Button>
                <Button type="button" onClick={() => void finishActivation()} loading={loading}>
                  برو داشبورد
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
        <Card className="max-w-md border-border bg-surface shadow-sm">
          <CardContent className="space-y-4 py-8">
            <h1 className="text-2xl font-semibold text-foreground">فروشگاهت آماده‌ست</h1>
            <p className="text-sm leading-6 text-foreground-muted">
              سفارش‌ها، محصول‌ها و گفتگوها رو از داشبورد مدیریت کن. لینک فروشگاهت رو هم برای مشتری‌ها بفرست.
            </p>
            <Button type="button" onClick={() => router.replace(paths.seller.dashboard)}>
              برو داشبورد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <BrandMark />
          <div className="flex items-center gap-3 text-xs text-foreground-muted">
            <span className="hidden sm:inline">{savingNote}</span>
            <span className="rounded-full bg-surface-muted px-2.5 py-1 font-medium text-foreground">
              {activeStepIndex + 1}/{STEP_ORDER.length}
            </span>
          </div>
        </div>
        <div className="h-1 bg-surface-muted">
          <div
            className="h-full bg-brand transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-foreground-muted">مراحل</p>
            <StepNav
              steps={STEP_ORDER}
              activeKey={activeStep.key}
              completed={completedSteps}
              onSelect={(key) => void goToStep(key)}
            />
            <button
              type="button"
              className="px-3 text-xs text-foreground-muted underline-offset-2 hover:text-foreground hover:underline"
              onClick={() => void skipWelcome()}
            >
              برو داشبورد
            </button>
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-foreground-muted">
              مرحله {activeStepIndex + 1} از {STEP_ORDER.length}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{activeStep.title}</h1>
            {activeStep.description ? (
              <p className="max-w-xl text-sm leading-6 text-foreground-muted">{activeStep.description}</p>
            ) : null}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden" aria-label="مراحل">
            {STEP_ORDER.map((step, index) => {
              const active = step.key === activeStep.key;
              const done = completedSteps.includes(step.key);
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => void goToStep(step.key)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
                    active
                      ? "bg-brand text-white"
                      : done
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-surface-muted text-foreground-muted",
                  )}
                >
                  {index + 1}. {step.title}
                </button>
              );
            })}
          </div>

          {error ? <ErrorAlert message={error} /> : null}
          {renderStep()}
        </main>
      </div>
    </div>
  );
}
