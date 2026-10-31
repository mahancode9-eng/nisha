"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/format";
import { getApiUrl } from "@/lib/env";
import { cn } from "@/lib/cn";
import {
  buildShareCardBlob,
  type ShareCardFormat,
} from "@/lib/share/buildShareCard";

type ProductShareSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  price: string | number;
  storeName: string;
  storeSlug: string;
  productId: number;
  imageUrl: string | null;
  shareUrl: string;
  brandColor?: string | null;
  allowPostTemplate?: boolean;
  removeWatermark?: boolean;
};

type ShortLinkPayload = {
  code: string;
  url: string;
  qr_url: string;
};

export function ProductShareSheet({
  open,
  onClose,
  title,
  price,
  storeName,
  storeSlug,
  productId,
  imageUrl,
  shareUrl,
  brandColor,
  allowPostTemplate = false,
  removeWatermark = false,
}: ProductShareSheetProps) {
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [format, setFormat] = useState<ShareCardFormat>("story");
  const [shortLink, setShortLink] = useState<ShortLinkPayload | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${getApiUrl()}/api/v1/public/short-links/product?slug=${encodeURIComponent(storeSlug)}&product_id=${productId}`,
          { method: "POST" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as ShortLinkPayload;
        if (!cancelled) setShortLink(data);
      } catch {
        /* keep full URL fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, storeSlug, productId]);

  if (!open) return null;

  const linkToShare = shortLink?.url || shareUrl;
  const qrSrc = shortLink
    ? `${getApiUrl()}${shortLink.qr_url.startsWith("/") ? shortLink.qr_url : `/${shortLink.qr_url}`}`
    : `${getApiUrl()}/api/v1/public/qr.png?data=${encodeURIComponent(shareUrl)}`;

  async function downloadCard() {
    setBusy(true);
    setHint(null);
    try {
      const blob = await buildShareCardBlob({
        title,
        priceLabel: formatMoney(price),
        storeName,
        imageUrl,
        format,
        brandColor: allowPostTemplate ? brandColor : null,
        showWatermark: !removeWatermark,
      });
      if (!blob) {
        setHint("ساخت تصویر نشد");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nisha-${format}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setHint(format === "story" ? "تصویر استوری دانلود شد" : "تصویر پست دانلود شد");
    } catch {
      setHint("ساخت تصویر نشد");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(linkToShare);
      setHint("لینک کپی شد");
    } catch {
      setHint("کپی لینک نشد");
    }
  }

  async function nativeShare() {
    const shareText = `${title} — ${formatMoney(price)}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, text: shareText, url: linkToShare });
        return;
      }
      await copyLink();
    } catch {
      /* cancelled */
    }
  }

  async function downloadQr() {
    try {
      const res = await fetch(qrSrc);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nisha-qr-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setHint("QR دانلود شد");
    } catch {
      setHint("دانلود QR نشد");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="اشتراک‌گذاری محصول"
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">اشتراک‌گذاری</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              لینک کوتاه، QR و کارت استوری/پست
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-foreground-muted hover:text-foreground"
          >
            بستن
          </button>
        </div>

        <div className="mb-4 grid grid-cols-[1fr_auto] gap-3 overflow-hidden rounded-xl border border-border bg-surface-muted p-3">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-medium text-foreground">{title}</p>
            <p className="text-sm text-brand">{formatMoney(price)}</p>
            <p className="truncate text-xs text-foreground-muted" dir="ltr">
              {linkToShare}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR" className="h-24 w-24 rounded-lg bg-white p-1" />
        </div>

        {allowPostTemplate ? (
          <div className="mb-3 flex gap-2">
            {(["story", "post"] as ShareCardFormat[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFormat(item)}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2 text-sm",
                  format === item
                    ? "border-brand bg-brand/10 text-foreground"
                    : "border-border text-foreground-muted",
                )}
              >
                {item === "story" ? "استوری ۹:۱۶" : "پست ۱:۱"}
              </button>
            ))}
          </div>
        ) : (
          <p className="mb-3 text-xs text-foreground-muted">
            قالب پست و رنگ برند تو پلن پایه به بالاست.
          </p>
        )}

        <div className="grid gap-2">
          <Button onClick={() => void nativeShare()}>اشتراک‌گذاری لینک</Button>
          <Button variant="secondary" loading={busy} onClick={() => void downloadCard()}>
            {format === "story" ? "دانلود تصویر استوری" : "دانلود تصویر پست"}
          </Button>
          <Button variant="secondary" onClick={() => void copyLink()}>
            کپی لینک کوتاه
          </Button>
          <Button variant="secondary" onClick={() => void downloadQr()}>
            دانلود QR
          </Button>
          {allowPostTemplate ? (
            <Button
              variant="secondary"
              onClick={async () => {
                const post = [
                  storeName,
                  "",
                  title,
                  formatMoney(price),
                  "",
                  `سفارش: ${linkToShare}`,
                ].join("\n");
                try {
                  await navigator.clipboard.writeText(post);
                  setHint("متن پست کانال تلگرام کپی شد");
                } catch {
                  setHint("کپی متن کانال نشد");
                }
              }}
            >
              کپی پست کانال تلگرام
            </Button>
          ) : null}
          <Button
            variant="secondary"
            onClick={async () => {
              const live = [
                `لایو: ${title}`,
                formatMoney(price),
                "",
                "برای سفارش بزن روی لینک:",
                linkToShare,
              ].join("\n");
              try {
                await navigator.clipboard.writeText(live);
                setHint("متن لایو کپی شد؛ تو کامنت یا استوری بفرست");
              } catch {
                setHint("کپی متن لایو نشد");
              }
            }}
          >
            کپی متن لایو
          </Button>
        </div>
        {hint ? <p className="mt-3 text-center text-sm text-foreground-muted">{hint}</p> : null}
      </div>
    </div>
  );
}
