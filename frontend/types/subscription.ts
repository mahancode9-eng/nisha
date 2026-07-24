export type BillingPeriod = "MONTHLY" | "QUARTERLY" | "YEARLY";

export type SubscriptionInvoiceStatus =
  | "PENDING_PAYMENT"
  | "PROOF_UPLOADED"
  | "PAID"
  | "REJECTED"
  | "CANCELLED";

export type PlanEntitlements = {
  max_products: number | null;
  max_product_images: number;
  product_video: boolean;
  custom_fields: boolean;
  discounts: boolean;
  analytics_max_days: number;
  guest_checkout: boolean;
  badge_trust: boolean;
  badge_premium: boolean;
  store_theme: boolean;
  excel_export: boolean;
  store_pages: boolean;
  priority_support: boolean;
  [key: string]: unknown;
};

export type SubscriptionPlan = {
  id: number;
  code: string;
  name_fa: string;
  monthly_price_toman: number;
  quarterly_price_toman: number;
  yearly_price_toman: number;
  is_recommended: boolean;
  sort_order: number;
  is_active: boolean;
  entitlements: PlanEntitlements;
};

export type SellerSubscription = {
  id: number;
  plan: SubscriptionPlan;
  status: "ACTIVE" | "PAST_DUE" | "CANCELLED";
  billing_period: BillingPeriod;
  current_period_start: string | null;
  current_period_end: string | null;
  started_at: string;
};

export type SellerSubscriptionDetail = {
  subscription: SellerSubscription;
  effective_plan: SubscriptionPlan;
  entitlements: PlanEntitlements;
  is_expired_fallback: boolean;
};

export type SubscriptionPaymentProof = {
  id: number;
  image_url: string;
  uploaded_at: string;
};

export type SubscriptionInvoice = {
  id: number;
  plan: SubscriptionPlan;
  period: BillingPeriod;
  amount_toman: number;
  status: SubscriptionInvoiceStatus;
  period_start: string | null;
  period_end: string | null;
  admin_note: string | null;
  created_at: string;
  proofs: SubscriptionPaymentProof[];
};

export type CardInstructions = {
  card_number: string;
  card_owner: string;
  card_bank: string;
  message: string;
};

export type SubscriptionCheckoutResponse = {
  invoice: SubscriptionInvoice;
  payment: {
    provider: string;
    mode: string;
    instructions: Record<string, unknown>;
    redirect_url: string | null;
    external_reference: string | null;
  };
  card_instructions: CardInstructions;
};

export type AdminSubscriptionInvoice = SubscriptionInvoice & {
  seller_user_id: number;
  seller_email: string | null;
  seller_full_name: string | null;
};
