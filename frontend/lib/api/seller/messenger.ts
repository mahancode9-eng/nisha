import { apiGet, apiPost } from "@/lib/api/client";

export type MessengerStatus = {
  telegram_linked: boolean;
  bale_linked: boolean;
  telegram_chat_id: string | null;
  bale_chat_id: string | null;
  telegram_configured: boolean;
  bale_configured: boolean;
};

export type MessengerConnectResponse = {
  channel: "telegram" | "bale";
  deep_link: string;
  linked: boolean;
  chat_id: string | null;
};

export function getMessengerStatus(): Promise<MessengerStatus> {
  return apiGet<MessengerStatus>("/api/v1/seller/messenger/status");
}

export function connectMessenger(
  channel: "telegram" | "bale",
): Promise<MessengerConnectResponse> {
  return apiPost<MessengerConnectResponse>("/api/v1/seller/messenger/connect", {
    channel,
  });
}

export function disconnectMessenger(
  channel: "telegram" | "bale",
): Promise<MessengerStatus> {
  return apiPost<MessengerStatus>("/api/v1/seller/messenger/disconnect", {
    channel,
  });
}
