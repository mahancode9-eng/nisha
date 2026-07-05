import { apiGet, apiPost } from "@/lib/api/client";
import type {
  ConversationDetail,
  ConversationListItem,
  Message,
  MessageCreate,
} from "@/types/chat";

export interface ConversationListResponse {
  items: ConversationListItem[];
  total: number;
  page: number;
  page_size: number;
}

export function listConversations(page = 1, pageSize = 20): Promise<ConversationListItem[]> {
  return apiGet<ConversationListResponse>(
    `/api/v1/seller/conversations?page=${page}&page_size=${pageSize}`,
  ).then((res) => res.items);
}

export function getConversation(id: number): Promise<ConversationDetail> {
  return apiGet<ConversationDetail>(`/api/v1/seller/conversations/${id}`);
}

export function sendMessage(conversationId: number, body: MessageCreate): Promise<Message> {
  return apiPost<Message>(`/api/v1/seller/conversations/${conversationId}/messages`, body);
}
