import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import type { ConversationListItem as ConversationItem } from "@/types/chat";

type ConversationListItemProps = {
  item: ConversationItem;
  href: string;
  subtitle?: string;
};

export function ConversationListItemRow({
  item,
  href,
  subtitle,
}: ConversationListItemProps) {
  const initial = item.store_name.charAt(0).toUpperCase();
  const preview = item.last_message_body ?? "هنوز پیامی ثبت نشده";
  const time = item.last_message_at ?? item.updated_at;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-border px-4 py-3 hover:bg-surface-muted"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-neutral-900">
            {subtitle ?? item.store_name}
          </p>
          <span className="shrink-0 text-xs text-neutral-500">{formatDateTime(time)}</span>
        </div>
        <p className="truncate text-sm text-neutral-600">{preview}</p>
        {item.invoice_code && (
          <p className="truncate text-xs text-neutral-400">سفارش {item.invoice_code}</p>
        )}
      </div>
      {item.unread_count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-medium text-white">
          {item.unread_count}
        </span>
      )}
    </Link>
  );
}
