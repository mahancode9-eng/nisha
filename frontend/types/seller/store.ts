export type Store = {
  id: number;
  owner_id: number;
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
  is_active: boolean;
  guest_checkout_enabled: boolean;
  theme_preset: string | null;
  primary_color: string | null;
  about_text: string | null;
  shipping_policy_text: string | null;
  default_shipping_cost: string;
  free_shipping_min_subtotal: string | null;
  social_links: StoreSocialLink[];
  created_at: string;
  updated_at: string;
};

export type StoreSocialLink = {
  id: number;
  store_id: number;
  label: string;
  url: string;
  icon_key: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StoreSocialLinkInput = {
  label: string;
  url: string;
  icon_key?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type StoreUpdate = {
  name?: string;
  slug?: string;
  description?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  category_slug?: string | null;
  category_name?: string | null;
  location?: string | null;
  phone?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  bale?: string | null;
  website?: string | null;
  support_contact?: string | null;
  is_active?: boolean;
  guest_checkout_enabled?: boolean;
  theme_preset?: string | null;
  primary_color?: string | null;
  about_text?: string | null;
  shipping_policy_text?: string | null;
  default_shipping_cost?: number | string | null;
  free_shipping_min_subtotal?: number | string | null;
  social_links?: StoreSocialLinkInput[];
};
