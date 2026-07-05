import type { PaymentMethodType } from "@/types/seller/payment-method";
import type { ProductFormField, ProductImage } from "@/types/seller/product";

export type PublicStoreProfile = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  category_slug: string | null;
  category_name: string | null;
  location: string | null;
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  instagram: string | null;
  bale: string | null;
  website: string | null;
  support_contact: string | null;
  trust_badges: string[];
};

export type PublicStoreSocialLink = {
  id: number;
  label: string;
  url: string;
  icon_key: string | null;
  sort_order: number;
  is_active: boolean;
};

export type PublicProductImage = ProductImage;

export type PublicProductFormField = ProductFormField;

export type PublicProduct = {
  id: number;
  title: string;
  description: string | null;
  price: string;
  stock_quantity: number;
  images: PublicProductImage[];
  form_fields: PublicProductFormField[];
  image_count: number;
};

export type PublicStoreReview = {
  id: number;
  order_id: number;
  customer_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  image_urls: string[];
  status: "PRIVATE" | "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
};

export type PublicStoreReviewSummary = {
  average_rating: number;
  review_count: number;
  recent_reviews: PublicStoreReview[];
};

export type PublicPaymentMethod = {
  id: number;
  type: PaymentMethodType;
  display_name: string;
  card_number: string | null;
  wallet_address: string | null;
  external_url: string | null;
  owner_name: string | null;
  instructions: string | null;
};

export type PublicStorePageResponse = {
  store: PublicStoreProfile;
  social_links: PublicStoreSocialLink[];
  products: PublicProduct[];
  payment_methods: PublicPaymentMethod[];
  review_summary: PublicStoreReviewSummary;
};

export type PublicProductDetailResponse = {
  store: PublicStoreProfile;
  product: PublicProduct;
  review_summary: PublicStoreReviewSummary;
  public_reviews: PublicStoreReview[];
};

export type PublicHomepageCategory = {
  label: string;
  slug: string;
  query: string;
  product_count: number;
  icon_key: string | null;
};

export type PublicHomepageProduct = {
  product: PublicProduct;
  store: PublicStoreProfile;
  average_rating: number;
  review_count: number;
};

export type PublicHomepageStore = {
  store: PublicStoreProfile;
  product_count: number;
  average_rating: number;
  review_count: number;
};

export type PublicHomepageReview = {
  id: number;
  store_name: string;
  store_slug: string;
  product_title: string | null;
  customer_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  image_urls: string[];
  created_at: string;
};

export type PublicHomepageStats = {
  total_stores: number;
  total_products: number;
  total_reviews: number;
  average_rating: number;
};

export type PublicHomepageResponse = {
  query: string | null;
  hero_title: string;
  hero_subtitle: string;
  search_hint: string;
  stats: PublicHomepageStats;
  categories: PublicHomepageCategory[];
  featured_products: PublicHomepageProduct[];
  featured_stores: PublicHomepageStore[];
  recent_reviews: PublicHomepageReview[];
  trust_indicators: string[];
};
