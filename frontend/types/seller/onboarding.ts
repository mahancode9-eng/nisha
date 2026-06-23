import type { PublicHomepageCategory } from "@/types/public/store";
import type { SocialPlatformKey } from "@/components/ui/SocialIcon";
import type { Store } from "@/types/seller/store";

export type SellerOnboardingStatus = "NOT_STARTED" | "IN_PROGRESS" | "SKIPPED" | "COMPLETED";

export type SellerOnboardingStepKey =
  | "welcome"
  | "store_identity"
  | "store_information"
  | "contact_channels"
  | "first_product"
  | "education"
  | "activation";

export type SellerOnboardingEvent = {
  type: string;
  step: SellerOnboardingStepKey | null;
  timestamp: string;
};

export type SellerOnboardingIdentityDraft = {
  name: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
};

export type SellerOnboardingInformationDraft = {
  description: string | null;
  category_slug: string | null;
  category_name: string | null;
  location: string | null;
};

export type SellerOnboardingContactChannelDraft = {
  platform: SocialPlatformKey;
  label: string;
  url: string;
  is_active: boolean;
};

export type SellerOnboardingFirstProductDraft = {
  product_id: number | null;
  title: string | null;
  price: string | null;
  description: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  stock_quantity: number;
  is_active: boolean;
};

export type SellerOnboardingDrafts = {
  store_identity: SellerOnboardingIdentityDraft;
  store_information: SellerOnboardingInformationDraft;
  contact_channels: SellerOnboardingContactChannelDraft[];
  first_product: SellerOnboardingFirstProductDraft;
};

export type SellerOnboardingState = {
  status: SellerOnboardingStatus;
  current_step: SellerOnboardingStepKey;
  completed_steps: SellerOnboardingStepKey[];
  drafts: SellerOnboardingDrafts;
  started_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
  skipped_at: string | null;
  first_product_id: number | null;
  events: SellerOnboardingEvent[];
};

export type SellerOnboardingResponse = {
  store: Store;
  state: SellerOnboardingState;
  categories: PublicHomepageCategory[];
};

export type SellerOnboardingUpdate = {
  current_step?: SellerOnboardingStepKey;
  status?: SellerOnboardingStatus;
  completed_steps?: SellerOnboardingStepKey[];
  store_identity?: Partial<SellerOnboardingIdentityDraft>;
  store_information?: Partial<SellerOnboardingInformationDraft>;
  contact_channels?: SellerOnboardingContactChannelDraft[];
  first_product?: Partial<SellerOnboardingFirstProductDraft>;
  first_product_id?: number | null;
};

