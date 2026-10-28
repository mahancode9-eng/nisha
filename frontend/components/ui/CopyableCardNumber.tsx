"use client";

import { useState } from "react";
import { formatCardNumber, toPersianDigits } from "@/lib/format";

type CopyableCardNumberProps = {
  value: string;
  label?: string;
};

export function CopyableCardNumber({ value, label = "کارت مقصد" }: CopyableCardNumberProps) {
  const [copied, setCopied] = useState(false);
  const digits = value.replace(/\D/g, "");
  const display = toPersianDigits(formatCardNumber(digits || value));

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(digits || value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span>
        {label}:{" "}
        <span className="font-mono tracking-wide" dir="ltr">
          {display}
        </span>
      </span>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="rounded-md border border-amber-600/30 bg-white/60 px-2 py-0.5 text-xs font-medium text-amber-950 transition hover:bg-white dark:bg-black/20 dark:text-amber-100"
      >
        {copied ? "کپی شد" : "کپی"}
      </button>
    </div>
  );
}
