import { customerApiGet, customerApiPost } from "@/lib/api/customer-client";
import type {
  ConversationCreate,
  ConversationDetail,
  ConversationListItem,
  Message,
  MessageCreate,
} from "@/types/chat";

export function createConversation(
  body: ConversationCreate,
): Promise<ConversationListItem> {
  return customerApiPost<ConversationListItem>("/api/v1/customer/conversations", body);
}

export interface ConversationListResponse {
  items: ConversationListItem[];
  total: number;
  page: number;
  page_size: number;
}

export function listConversations(page = 1, pageSize = 20): Promise<ConversationListItem[]> {
  return customerApiGet<ConversationListResponse>(
    `/api/v1/customer/conversations?page=${page}&page_size=${pageSize}`,
  ).then((res) => res.items);
}

export function getConversation(id: number): Promise<ConversationDetail> {
  return customerApiGet<ConversationDetail>(`/api/v1/customer/conversations/${id}`);
}

export function sendMessage(conversationId: number, body: MessageCreate): Promise<Message> {
  return customerApiPost<Message>(
    `/api/v1/customer/conversations/${conversationId}/messages`,
    body,
  );
}
