"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

type ProductShareSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  price: string | number;
  storeName: string;
  imageUrl: string | null;
  shareUrl: string;
};

const STORY_W = 1080;
const STORY_H = 1920;

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function buildStoryBlob(opts: {
  title: string;
  priceLabel: string;
  storeName: string;
  imageUrl: string | null;
}): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 0, STORY_H);
  gradient.addColorStop(0, "#1a1512");
  gradient.addColorStop(1, "#3d2a1f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  if (opts.imageUrl) {
    const img = await loadImage(opts.imageUrl);
    if (img) {
      const size = 900;
      const x = (STORY_W - size) / 2;
      const y = 220;
      ctx.save();
      const r = 48;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + size, y, x + size, y + size, r);
      ctx.arcTo(x + size, y + size, x, y + size, r);
      ctx.arcTo(x, y + size, x, y, r);
      ctx.arcTo(x, y, x + size, y, r);
      ctx.closePath();
      ctx.clip();
      const scale = Math.max(size / img.width, size / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
      ctx.restore();
    }
  }

  ctx.fillStyle = "#f5efe6";
  ctx.textAlign = "center";
  ctx.direction = "rtl";
  ctx.font = "600 48px Vazirmatn, Tahoma, sans-serif";
  ctx.fillText(opts.storeName.slice(0, 40), STORY_W / 2, 160);

  ctx.font = "700 64px Vazirmatn, Tahoma, sans-serif";
  const title = opts.title.length > 42 ? opts.title.slice(0, 40) + "…" : opts.title;
  wrapText(ctx, title, STORY_W / 2, 1240, STORY_W - 160, 78);

  ctx.font = "600 56px Vazirmatn, Tahoma, sans-serif";
  ctx.fillStyle = "#e8c9a0";
  ctx.fillText(opts.priceLabel, STORY_W / 2, 1480);

  ctx.font = "500 36px Vazirmatn, Tahoma, sans-serif";
  ctx.fillStyle = "rgba(245,239,230,0.7)";
  ctx.fillText("نیشا", STORY_W / 2, 1780);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

export function ProductShareSheet({
  open,
  onClose,
  title,
  price,
  storeName,
  imageUrl,
  shareUrl,
}: ProductShareSheetProps) {
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function downloadStory() {
    setBusy(true);
    setHint(null);
    try {
      const blob = await buildStoryBlob({
        title,
        priceLabel: formatMoney(price),
        storeName,
        imageUrl,
      });
      if (!blob) {
        setHint("ساخت تصویر استوری نشد");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nisha-story-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setHint("تصویر استوری دانلود شد");
    } catch {
      setHint("ساخت تصویر استوری نشد");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setHint("لینک کپی شد");
    } catch {
      setHint("کپی لینک نشد");
    }
  }

  async function nativeShare() {
    const shareText = `${title} — ${formatMoney(price)}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      }
      await copyLink();
    } catch {
      /* cancelled */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="اشتراک‌گذاری محصول"
        className={cn(
          "w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">اشتراک‌گذاری</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              لینک بفرست یا تصویر استوری بگیر
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

        <div className="mb-4 overflow-hidden rounded-xl border border-border bg-surface-muted">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="aspect-[4/5] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center text-sm text-foreground-muted">
              بدون تصویر
            </div>
          )}
          <div className="space-y-1 p-3">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-sm text-brand">{formatMoney(price)}</p>
            <p className="text-xs text-foreground-muted">{storeName}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <Button onClick={() => void nativeShare()}>اشتراک‌گذاری لینک</Button>
          <Button variant="secondary" loading={busy} onClick={() => void downloadStory()}>
            دانلود تصویر استوری
          </Button>
          <Button variant="secondary" onClick={() => void copyLink()}>
            کپی لینک
          </Button>
        </div>
        {hint ? <p className="mt-3 text-center text-sm text-foreground-muted">{hint}</p> : null}
      </div>
    </div>
  );
}
