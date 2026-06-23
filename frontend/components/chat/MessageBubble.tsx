import { formatDateTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import type { Message } from "@/types/chat";

type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
};

function isImageAttachment(message: Message): boolean {
  return !!message.attachment_url && (message.attachment_mime_type?.startsWith("image/") ?? false);
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const imageAttachment = isImageAttachment(message);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 sm:max-w-[70%] ${
          isOwn
            ? "rounded-be-md bg-brand text-white"
            : "rounded-bs-md bg-surface-muted text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm">{message.body}</p>
        {message.attachment_url && imageAttachment && (
          <a href={resolveMediaUrl(message.attachment_url)} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveMediaUrl(message.attachment_url)}
              alt="پیوست پیام"
              className="mt-2 max-h-56 rounded-xl object-cover"
            />
          </a>
        )}
        {message.attachment_url && !imageAttachment && (
          <a
            href={resolveMediaUrl(message.attachment_url)}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 block text-xs underline ${isOwn ? "text-white/80" : "text-brand"}`}
          >
            پیوست
          </a>
        )}
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            isOwn ? "text-white/70" : "text-foreground-muted"
          }`}
        >
          <span>{formatDateTime(message.created_at)}</span>
          {isOwn && <span aria-label={message.is_read ? "خوانده‌شده" : "ارسال‌شده"}>{message.is_read ? "✓✓" : "✓"}</span>}
        </div>
      </div>
    </div>
  );
}
