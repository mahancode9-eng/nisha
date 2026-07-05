"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type {
  PaymentMethod,
  PaymentMethodCreate,
  PaymentMethodType,
  PaymentMethodUpdate,
} from "@/types/seller/payment-method";

type PaymentMethodFormProps = {
  initial?: PaymentMethod;
  onSubmit: (data: PaymentMethodCreate | PaymentMethodUpdate) => Promise<void>;
  onCancel: () => void;
};

export function PaymentMethodForm({ initial, onSubmit, onCancel }: PaymentMethodFormProps) {
  const [type, setType] = useState<PaymentMethodType>(initial?.type ?? "CARD_TO_CARD");
  const [displayName, setDisplayName] = useState(initial?.display_name ?? "");
  const [cardNumber, setCardNumber] = useState(initial?.card_number ?? "");
  const [ownerName, setOwnerName] = useState(initial?.owner_name ?? "");
  const [walletAddress, setWalletAddress] = useState(initial?.wallet_address ?? "");
  const [externalUrl, setExternalUrl] = useState(initial?.external_url ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setType(initial.type);
      setDisplayName(initial.display_name);
      setCardNumber(initial.card_number ?? "");
      setOwnerName(initial.owner_name ?? "");
      setWalletAddress(initial.wallet_address ?? "");
      setExternalUrl(initial.external_url ?? "");
      setInstructions(initial.instructions ?? "");
      setIsActive(initial.is_active);
    }
  }, [initial]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!displayName.trim()) {
      setError("نام نمایشی الزامی است.");
      return;
    }
    setLoading(true);
    try {
      const base = {
        display_name: displayName.trim(),
        instructions: instructions.trim() || null,
        is_active: isActive,
      };
      if (initial) {
        const update: PaymentMethodUpdate = { ...base, type, card_number: null, owner_name: null, wallet_address: null, external_url: null };
        if (type === "CARD_TO_CARD") {
          update.card_number = cardNumber.trim() || null;
          update.owner_name = ownerName.trim() || null;
        } else if (type === "CRYPTO") {
          update.wallet_address = walletAddress.trim() || null;
        } else {
          update.external_url = externalUrl.trim() || null;
        }
        await onSubmit(update);
      } else {
        const create: PaymentMethodCreate = { ...base, type };
        if (type === "CARD_TO_CARD") {
          create.card_number = cardNumber.trim();
          create.owner_name = ownerName.trim();
        } else if (type === "CRYPTO") {
          create.wallet_address = walletAddress.trim();
        } else {
          create.external_url = externalUrl.trim();
        }
        await onSubmit(create);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیره ممکن نشد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">نوع</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as PaymentMethodType)}
          disabled={!!initial}
          className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="CARD_TO_CARD">کارت‌به‌کارت</option>
          <option value="CRYPTO">رمزارز</option>
          <option value="EXTERNAL_GATEWAY">درگاه خارجی</option>
        </select>
      </div>
      <Input
        label="نام نمایشی"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
      />
      {type === "CARD_TO_CARD" && (
        <>
          <Input
            label="شماره کارت"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            required
          />
          <Input
            label="نام صاحب حساب"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            required
          />
        </>
      )}
      {type === "CRYPTO" && (
        <Input
          label="آدرس کیف پول"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          required
        />
      )}
      {type === "EXTERNAL_GATEWAY" && (
        <Input
          label="نشانی درگاه"
          type="url"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          required
        />
      )}
      <Textarea
        label="توضیحات"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        rows={3}
      />
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-border"
        />
        فعال
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          انصراف
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? "به‌روزرسانی" : "ایجاد"}
        </Button>
      </div>
    </form>
  );
}
