import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import type { PaginatedResponse, PaginationParams } from "@/types/api/pagination";
import type {
  Product,
  ProductCreate,
  ProductFormField,
  ProductFormFieldInput,
  ProductFormFieldReorderRequest,
  ProductImage,
  ProductImageInput,
  ProductImageReorderRequest,
  ProductUpdate,
} from "@/types/seller/product";

export function listProducts(
  params: PaginationParams = {},
): Promise<PaginatedResponse<Product>> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const query = q.toString();
  return apiGet<PaginatedResponse<Product>>(
    `/api/v1/seller/products${query ? `?${query}` : ""}`,
  );
}

export function getProduct(id: number): Promise<Product> {
  return apiGet<Product>(`/api/v1/seller/products/${id}`);
}

export function createProduct(body: ProductCreate): Promise<Product> {
  return apiPost<Product>("/api/v1/seller/products", body);
}

export function updateProduct(id: number, body: ProductUpdate): Promise<Product> {
  return apiPut<Product>(`/api/v1/seller/products/${id}`, body);
}

export function deleteProduct(id: number): Promise<void> {
  return apiDelete(`/api/v1/seller/products/${id}`);
}

export function createProductImage(
  productId: number,
  body: ProductImageInput,
): Promise<ProductImage> {
  return apiPost<ProductImage>(`/api/v1/seller/products/${productId}/images`, body);
}

export function updateProductImage(
  productId: number,
  imageId: number,
  body: ProductImageInput,
): Promise<ProductImage> {
  return apiPut<ProductImage>(`/api/v1/seller/products/${productId}/images/${imageId}`, body);
}

export function deleteProductImage(productId: number, imageId: number): Promise<void> {
  return apiDelete(`/api/v1/seller/products/${productId}/images/${imageId}`);
}

export function reorderProductImages(
  productId: number,
  body: ProductImageReorderRequest,
): Promise<ProductImage[]> {
  return apiPatch<ProductImage[]>(`/api/v1/seller/products/${productId}/images/reorder`, body);
}

export function createProductFormField(
  productId: number,
  body: ProductFormFieldInput,
): Promise<ProductFormField> {
  return apiPost<ProductFormField>(`/api/v1/seller/products/${productId}/form-fields`, body);
}

export function updateProductFormField(
  productId: number,
  fieldId: number,
  body: ProductFormFieldInput,
): Promise<ProductFormField> {
  return apiPut<ProductFormField>(`/api/v1/seller/products/${productId}/form-fields/${fieldId}`, body);
}

export function deleteProductFormField(productId: number, fieldId: number): Promise<void> {
  return apiDelete(`/api/v1/seller/products/${productId}/form-fields/${fieldId}`);
}

export function reorderProductFormFields(
  productId: number,
  body: ProductFormFieldReorderRequest,
): Promise<ProductFormField[]> {
  return apiPatch<ProductFormField[]>(
    `/api/v1/seller/products/${productId}/form-fields/reorder`,
    body,
  );
}
