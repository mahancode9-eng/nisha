import {
  customerApiDownload,
  customerApiGet,
  customerApiPost,
} from "@/lib/api/customer-client";
import type {
  CustomerCheckoutCreate,
  CustomerComplaint,
  CustomerComplaintCreateRequest,
  CustomerDashboardSummary,
  CustomerOrderActionResponse,
  CustomerOrderClaimRequest,
  CustomerOrderDetail,
  CustomerOrderListItem,
  CustomerOrderReceiptUpdateRequest,
  CustomerReview,
  CustomerReviewCreateRequest,
} from "@/types/customer/order";
import type { CheckoutResponse } from "@/types/public/checkout";

export function createCustomerOrder(
  slug: string,
  body: CustomerCheckoutCreate,
): Promise<CheckoutResponse> {
  return customerApiPost<CheckoutResponse>(`/api/v1/customer/stores/${slug}/orders`, body);
}

export function listOrders(activeOnly = false): Promise<CustomerOrderListItem[]> {
  const query = activeOnly ? "?active_only=true" : "";
  return customerApiGet<CustomerOrderListItem[]>(`/api/v1/customer/orders${query}`);
}

export function listActiveOrders(): Promise<CustomerOrderListItem[]> {
  return customerApiGet<CustomerOrderListItem[]>("/api/v1/customer/orders/active");
}

export function getOrder(orderId: number): Promise<CustomerOrderDetail> {
  return customerApiGet<CustomerOrderDetail>(`/api/v1/customer/orders/${orderId}`);
}

export function claimOrder(body: CustomerOrderClaimRequest): Promise<CustomerOrderActionResponse> {
  return customerApiPost<CustomerOrderActionResponse>("/api/v1/customer/orders/claim", body);
}

export function setReceiptStatus(
  orderId: number,
  body: CustomerOrderReceiptUpdateRequest,
): Promise<CustomerOrderActionResponse> {
  return customerApiPost<CustomerOrderActionResponse>(
    `/api/v1/customer/orders/${orderId}/receipt`,
    body,
  );
}

export function createComplaint(
  orderId: number,
  body: CustomerComplaintCreateRequest,
): Promise<CustomerComplaint> {
  return customerApiPost<CustomerComplaint>(
    `/api/v1/customer/orders/${orderId}/complaints`,
    body,
  );
}

export function listComplaints(): Promise<CustomerComplaint[]> {
  return customerApiGet<CustomerComplaint[]>("/api/v1/customer/complaints");
}

export function createReview(body: CustomerReviewCreateRequest): Promise<CustomerReview> {
  return customerApiPost<CustomerReview>("/api/v1/customer/reviews", body);
}

export function listReviews(): Promise<CustomerReview[]> {
  return customerApiGet<CustomerReview[]>("/api/v1/customer/reviews");
}

export function getDashboard(): Promise<CustomerDashboardSummary> {
  return customerApiGet<CustomerDashboardSummary>("/api/v1/customer/dashboard");
}

export async function downloadInvoice(orderId: number): Promise<Blob> {
  return customerApiDownload(`/api/v1/customer/orders/${orderId}/invoice`);
}
