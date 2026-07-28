export type ProductCategory = {
  id: number;
  store_id: number;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductCategorySummary = {
  id: number;
  name: string;
  slug: string;
};

export type ProductCategoryCreate = {
  name: string;
  slug?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type ProductCategoryUpdate = {
  name?: string;
  slug?: string | null;
  sort_order?: number;
  is_active?: boolean;
};
