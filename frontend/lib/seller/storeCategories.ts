export type SellerStoreCategoryOption = {
  label: string;
  slug: string;
  query: string;
  iconKey: string | null;
};

export const SELLER_STORE_CATEGORY_OPTIONS: SellerStoreCategoryOption[] = [
  { label: "مد و پوشاک", slug: "fashion", query: "fashion clothing apparel", iconKey: "shirt" },
  { label: "زیبایی", slug: "beauty", query: "beauty skincare makeup", iconKey: "sparkles" },
  { label: "الکترونیک", slug: "electronics", query: "electronics gadgets tech", iconKey: "cpu" },
  { label: "خانه و دکور", slug: "home", query: "home decor household", iconKey: "home" },
  { label: "دیجیتال", slug: "digital", query: "digital services downloads", iconKey: "download" },
  { label: "اکسسوری", slug: "accessories", query: "accessories gifts add-ons", iconKey: "box" },
  { label: "سایر", slug: "other", query: "other", iconKey: null },
];

export function findSellerStoreCategory(slug: string | null | undefined): SellerStoreCategoryOption | undefined {
  if (!slug) return undefined;
  return SELLER_STORE_CATEGORY_OPTIONS.find((category) => category.slug === slug.trim().toLowerCase());
}

