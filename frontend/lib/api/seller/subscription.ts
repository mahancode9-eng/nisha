import { apiGet, apiPost, apiRequest } from "@/lib/api/client";
import type {
  BillingPeriod,
  CardInstructions,
  SellerSubscriptionDetail,
  SubscriptionCheckoutResponse,
  SubscriptionInvoice,
  SubscriptionPlan,
} from "@/types/subscription";

export function listPlans() {
  return apiGet<SubscriptionPlan[]>("/api/v1/seller/plans");
}

export function getSubscription() {
  return apiGet<SellerSubscriptionDetail>("/api/v1/seller/subscription");
}

export function getCardInstructions() {
  return apiGet<CardInstructions>("/api/v1/seller/subscription/card-instructions");
}

export function checkout(planCode: string, period: BillingPeriod) {
  return apiPost<SubscriptionCheckoutResponse>("/api/v1/seller/subscription/checkout", {
    plan_code: planCode,
    period,
  });
}

export function listInvoices() {
  return apiGet<SubscriptionInvoice[]>("/api/v1/seller/subscription/invoices");
}

export function uploadProof(invoiceId: number, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<SubscriptionInvoice>(
    `/api/v1/seller/subscription/invoices/${invoiceId}/proof`,
    { method: "POST", json: form },
  );
}

export function cancelInvoice(invoiceId: number) {
  return apiPost<SubscriptionInvoice>(
    `/api/v1/seller/subscription/invoices/${invoiceId}/cancel`,
    {},
  );
}
