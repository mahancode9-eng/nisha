import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type {
  DiscountCode,
  DiscountCodeCreate,
  DiscountCodeUpdate,
} from "@/types/seller/discount";

const BASE = "/api/v1/seller/discounts";

export function listDiscounts(): Promise<DiscountCode[]> {
  return apiGet<DiscountCode[]>(BASE);
}

export function createDiscount(body: DiscountCodeCreate): Promise<DiscountCode> {
  return apiPost<DiscountCode>(BASE, body);
}

export function updateDiscount(id: number, body: DiscountCodeUpdate): Promise<DiscountCode> {
  return apiPut<DiscountCode>(BASE + "/" + id, body);
}

export function deleteDiscount(id: number): Promise<void> {
  return apiDelete<void>(BASE + "/" + id);
}
