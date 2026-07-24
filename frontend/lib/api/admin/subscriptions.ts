import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type {
  AdminSubscriptionInvoice,
  BillingPeriod,
  SellerSubscription,
  SubscriptionInvoiceStatus,
  SubscriptionPlan,
} from "@/types/subscription";

export function listPlans() {
  return apiGet<SubscriptionPlan[]>("/api/v1/admin/plans");
}

export function updatePlan(
  planId: number,
  body: Partial<{
    name_fa: string;
    monthly_price_toman: number;
    quarterly_price_toman: number;
    yearly_price_toman: number;
    is_recommended: boolean;
    sort_order: number;
    is_active: boolean;
    entitlements: Record<string, unknown>;
  }>,
) {
  return apiPatch<SubscriptionPlan>(`/api/v1/admin/plans/${planId}`, body);
}

export function listInvoices(status?: SubscriptionInvoiceStatus) {
  const query = status ? `?status=${status}` : "";
  return apiGet<AdminSubscriptionInvoice[]>(`/api/v1/admin/subscriptions/invoices${query}`);
}

export function confirmInvoice(invoiceId: number, adminNote?: string) {
  return apiPost<AdminSubscriptionInvoice>(
    `/api/v1/admin/subscriptions/invoices/${invoiceId}/confirm`,
    { admin_note: adminNote ?? null },
  );
}

export function rejectInvoice(invoiceId: number, adminNote?: string) {
  return apiPost<AdminSubscriptionInvoice>(
    `/api/v1/admin/subscriptions/invoices/${invoiceId}/reject`,
    { admin_note: adminNote ?? null },
  );
}

export function assignPlan(
  sellerUserId: number,
  body: { plan_code: string; period?: BillingPeriod; months?: number },
) {
  return apiPost<SellerSubscription>(
    `/api/v1/admin/subscriptions/sellers/${sellerUserId}/assign`,
    body,
  );
}
