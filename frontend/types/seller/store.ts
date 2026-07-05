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
  social_links?: StoreSocialLinkInput[];
};
