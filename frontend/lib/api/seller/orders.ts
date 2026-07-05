import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api/pagination";
import type {
  ListOrdersParams,
  OrderStatusPatch,
  SellerOrderActionResponse,
  SellerOrderDetail,
  SellerOrderListItem,
} from "@/types/seller/order";

function buildQuery(params: ListOrdersParams): string {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.search) q.set("search", params.search);
  if (params.date_from) q.set("date_from", params.date_from);
  if (params.date_to) q.set("date_to", params.date_to);
  if (params.page) q.set("page", String(params.page));
  if (params.page_size) q.set("page_size", String(params.page_size));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function listOrders(
  params: ListOrdersParams = {},
): Promise<PaginatedResponse<SellerOrderListItem>> {
  return apiGet<PaginatedResponse<SellerOrderListItem>>(
    `/api/v1/seller/orders${buildQuery(params)}`,
  );
}

export function getOrder(id: number): Promise<SellerOrderDetail> {
  return apiGet<SellerOrderDetail>(`/api/v1/seller/orders/${id}`);
}

export function confirmPayment(id: number): Promise<SellerOrderActionResponse> {
  return apiPost<SellerOrderActionResponse>(`/api/v1/seller/orders/${id}/confirm-payment`);
}

export function rejectPayment(id: number): Promise<SellerOrderActionResponse> {
  return apiPost<SellerOrderActionResponse>(`/api/v1/seller/orders/${id}/reject-payment`);
}

export function patchOrderStatus(
  id: number,
  body: { status: OrderStatusPatch; note?: string | null },
): Promise<SellerOrderActionResponse> {
  return apiPatch<SellerOrderActionResponse>(`/api/v1/seller/orders/${id}/status`, body);
}
