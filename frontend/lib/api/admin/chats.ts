import { apiGet } from "@/lib/api/client";
import type { AdminChatDetail, AdminChatListItem } from "@/types/admin/moderation";

export function listChats(): Promise<AdminChatListItem[]> {
  return apiGet<AdminChatListItem[]>("/api/v1/admin/chats");
}

export function getChat(conversationId: number): Promise<AdminChatDetail> {
  return apiGet<AdminChatDetail>(`/api/v1/admin/chats/${conversationId}`);
}
