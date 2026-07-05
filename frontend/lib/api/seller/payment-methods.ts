import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type {
  PaymentMethod,
  PaymentMethodCreate,
  PaymentMethodUpdate,
} from "@/types/seller/payment-method";

export function listPaymentMethods(): Promise<PaymentMethod[]> {
  return apiGet<PaymentMethod[]>("/api/v1/seller/payment-methods");
}

export function createPaymentMethod(body: PaymentMethodCreate): Promise<PaymentMethod> {
  return apiPost<PaymentMethod>("/api/v1/seller/payment-methods", body);
}

export function updatePaymentMethod(
  id: number,
  body: PaymentMethodUpdate,
): Promise<PaymentMethod> {
  return apiPut<PaymentMethod>(`/api/v1/seller/payment-methods/${id}`, body);
}

export function deletePaymentMethod(id: number): Promise<void> {
  return apiDelete(`/api/v1/seller/payment-methods/${id}`);
}
