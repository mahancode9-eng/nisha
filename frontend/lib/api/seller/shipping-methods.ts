import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type {
  ShippingMethod,
  ShippingMethodCreate,
  ShippingMethodUpdate,
} from "@/types/seller/shipping-method";

export function listShippingMethods(): Promise<ShippingMethod[]> {
  return apiGet<ShippingMethod[]>("/api/v1/seller/shipping-methods");
}

export function createShippingMethod(body: ShippingMethodCreate): Promise<ShippingMethod> {
  return apiPost<ShippingMethod>("/api/v1/seller/shipping-methods", body);
}

export function updateShippingMethod(
  id: number,
  body: ShippingMethodUpdate,
): Promise<ShippingMethod> {
  return apiPut<ShippingMethod>(`/api/v1/seller/shipping-methods/${id}`, body);
}

export function deleteShippingMethod(id: number): Promise<void> {
  return apiDelete(`/api/v1/seller/shipping-methods/${id}`);
}
