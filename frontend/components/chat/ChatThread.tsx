"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import type { ConversationDetail, SenderType } from "@/types/chat";

type ChatThreadProps = {
  conversation: ConversationDetail | null;
  isLoading: boolean;
  error: string | null;
  ownSenderType: SenderType;
  onSend: (payload: {
    body: string;
    attachment_url?: string | null;
    attachment_mime_type?: string | null;
  }) => Promise<void>;
  header: ReactNode;
  showComposer?: boolean;
};

export function ChatThread({
  conversation,
  isLoading,
  error,
  ownSenderType,
  onSend,
  header,
  showComposer = true,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  if (isLoading && !conversation) {
    return <LoadingState message="در حال بارگذاری گفتگو..." />;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-border bg-surface lg:h-[calc(100vh-6rem)]">
      <div className="border-b border-border px-4 py-3">{header}</div>
      <ErrorAlert message={error ?? ""} className="mx-4 mt-2" />
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {conversation?.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender_type === ownSenderType}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      {showComposer && <ChatComposer onSend={onSend} disabled={!conversation} />}
    </div>
  );
}
