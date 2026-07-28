import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type {
  ProductCategory,
  ProductCategoryCreate,
  ProductCategoryUpdate,
} from "@/types/seller/category";

export function listCategories(): Promise<ProductCategory[]> {
  return apiGet<ProductCategory[]>("/api/v1/seller/categories");
}

export function createCategory(body: ProductCategoryCreate): Promise<ProductCategory> {
  return apiPost<ProductCategory>("/api/v1/seller/categories", body);
}

export function updateCategory(id: number, body: ProductCategoryUpdate): Promise<ProductCategory> {
  return apiPut<ProductCategory>(`/api/v1/seller/categories/${id}`, body);
}

export function deleteCategory(id: number): Promise<void> {
  return apiDelete(`/api/v1/seller/categories/${id}`);
}
