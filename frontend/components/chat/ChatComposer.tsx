"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { uploadPublicImage } from "@/lib/api/public/uploads";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

type ChatComposerProps = {
  onSend: (payload: {
    body: string;
    attachment_url?: string | null;
    attachment_mime_type?: string | null;
  }) => Promise<void>;
  disabled?: boolean;
};

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(
    () => () => {
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview);
      }
    },
    [attachmentPreview],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending || uploading) return;

    setSending(true);
    setError(null);
    try {
      let attachment_url: string | null = null;
      let attachment_mime_type: string | null = null;

      if (attachment) {
        setUploading(true);
        const uploaded = await uploadPublicImage(attachment);
        attachment_url = uploaded.url;
        attachment_mime_type = uploaded.mime_type ?? attachment.type ?? null;
      }

      await onSend({ body, attachment_url, attachment_mime_type });
      setText("");
      setAttachment(null);
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview);
      }
      setAttachmentPreview(null);
    } catch {
      setError("ارسال پیام ناموفق بود");
    } finally {
      setUploading(false);
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  }

  function handleAttachmentChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAttachment(file);
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
    setAttachmentPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-surface p-3 sm:p-4">
      <div className="space-y-3">
        {attachmentPreview && (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={attachmentPreview} alt="پیش‌نمایش پیوست" className="max-h-40 w-full object-cover" />
          </div>
        )}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="پیام خود را بنویسید..."
          rows={2}
          disabled={disabled || sending || uploading}
          className="resize-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAttachmentChange}
            disabled={disabled || sending || uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || sending || uploading}
          >
            پیوست تصویر
          </Button>
          {attachment && (
            <button
              type="button"
              onClick={() => {
                setAttachment(null);
                if (attachmentPreview) {
                  URL.revokeObjectURL(attachmentPreview);
                }
                setAttachmentPreview(null);
              }}
               className="text-sm text-foreground-muted underline"
            >
              حذف پیوست
            </button>
          )}
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="ms-auto">
            <Button type="submit" disabled={disabled || sending || uploading || !text.trim()}>
              {uploading ? "در حال بارگذاری..." : "ارسال پیام"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
