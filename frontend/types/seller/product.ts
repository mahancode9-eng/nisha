export type ProductFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "DROPDOWN"
  | "RADIO"
  | "CHECKBOX"
  | "FILE_UPLOAD";

export type ProductFieldOption = {
  label: string;
  value: string;
};

export type ProductImage = {
  id: number;
  image_url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  sort_order: number;
  mime_type: string | null;
  width: number | null;
  height: number | null;
};

export type ProductImageInput = {
  image_url: string;
  thumbnail_url?: string | null;
  alt_text?: string | null;
  sort_order?: number;
  mime_type?: string | null;
  width?: number | null;
  height?: number | null;
};

export type ProductFormField = {
  id: number;
  product_id: number;
  field_key: string;
  label: string;
  field_type: ProductFieldType;
  sort_order: number;
  is_required: boolean;
  placeholder: string | null;
  help_text: string | null;
  validation: Record<string, string | number | boolean | null> | null;
  options: ProductFieldOption[] | null;
  created_at: string;
  updated_at: string;
};

export type ProductFormFieldInput = {
  field_key: string;
  label: string;
  field_type: ProductFieldType;
  sort_order?: number;
  is_required?: boolean;
  placeholder?: string | null;
  help_text?: string | null;
  validation?: Record<string, string | number | boolean | null> | null;
  options?: ProductFieldOption[] | null;
};

export type ProductVariant = {
  id: number;
  product_id: number;
  name: string;
  price_override: string | null;
  stock_quantity: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductVariantInput = {
  name: string;
  price_override?: number | string | null;
  stock_quantity?: number;
  sort_order?: number;
  is_active?: boolean;
};

export type Product = {
  id: number;
  store_id: number;
  title: string;
  description: string | null;
  price: string;
  stock_quantity: number;
  is_active: boolean;
  video_url?: string | null;
  video_mime_type?: string | null;
  images: ProductImage[];
  form_fields: ProductFormField[];
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
};

export type ProductCreate = {
  title: string;
  description?: string | null;
  price: number | string;
  stock_quantity?: number;
  is_active?: boolean;
  video_url?: string | null;
  video_mime_type?: string | null;
  image_urls?: string[] | null;
  images?: ProductImageInput[] | null;
  form_fields?: ProductFormFieldInput[] | null;
  variants?: ProductVariantInput[] | null;
};

export type ProductUpdate = {
  title?: string;
  description?: string | null;
  price?: number | string;
  stock_quantity?: number;
  is_active?: boolean;
  video_url?: string | null;
  video_mime_type?: string | null;
  image_urls?: string[] | null;
  images?: ProductImageInput[] | null;
  form_fields?: ProductFormFieldInput[] | null;
  variants?: ProductVariantInput[] | null;
};

export type ProductImageReorderRequest = {
  ordered_ids: number[];
};

export type ProductFormFieldReorderRequest = {
  ordered_ids: number[];
};
