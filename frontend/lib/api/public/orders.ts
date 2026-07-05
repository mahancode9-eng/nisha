import { apiPatch, apiPost } from "@/lib/api/client";
import { apiPostForm } from "@/lib/api/upload";
import type {
  GuestOrderEdit,
  GuestOrderEditResponse,
  OrderTrackRequest,
  OrderTrackResponse,
  PublicOrderChatAuthRequest,
  PublicOrderMessageCreateRequest,
  PaymentProofUploadResponse,
  PublicReviewCreateRequest,
} from "@/types/public/order";
import type { ConversationDetail, Message } from "@/types/chat";
import type { CustomerReview } from "@/types/customer/order";

export function trackOrder(body: OrderTrackRequest): Promise<OrderTrackResponse> {
  return apiPost<OrderTrackResponse>("/api/v1/public/orders/track", body, { auth: false });
}

export function uploadPaymentProof(
  invoiceCode: string,
  invoiceEditPassword: string,
  file: File,
): Promise<PaymentProofUploadResponse> {
  const formData = new FormData();
  formData.append("invoice_edit_password", invoiceEditPassword);
  formData.append("file", file);
  return apiPostForm<PaymentProofUploadResponse>(
    `/api/v1/public/orders/${encodeURIComponent(invoiceCode)}/upload-payment-proof`,
    formData,
  );
}

export function editOrder(
  invoiceCode: string,
  body: GuestOrderEdit,
): Promise<GuestOrderEditResponse> {
  return apiPatch<GuestOrderEditResponse>(
    `/api/v1/public/orders/${encodeURIComponent(invoiceCode)}/edit`,
    body,
    { auth: false },
  );
}

export function openOrderChat(
  invoiceCode: string,
  body: PublicOrderChatAuthRequest,
): Promise<ConversationDetail> {
  return apiPost<ConversationDetail>(
    `/api/v1/public/orders/${encodeURIComponent(invoiceCode)}/chat`,
    body,
    { auth: false },
  );
}

export function sendOrderChatMessage(
  invoiceCode: string,
  body: PublicOrderMessageCreateRequest,
): Promise<Message> {
  return apiPost<Message>(
    `/api/v1/public/orders/${encodeURIComponent(invoiceCode)}/chat/messages`,
    body,
    { auth: false },
  );
}

export function createPublicReview(
  invoiceCode: string,
  body: PublicReviewCreateRequest,
): Promise<CustomerReview> {
  return apiPost<CustomerReview>(
    `/api/v1/public/orders/${encodeURIComponent(invoiceCode)}/reviews`,
    body,
    { auth: false },
  );
}
