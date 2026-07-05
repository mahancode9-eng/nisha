import { cn } from "@/lib/cn";
import type { PublicPaymentMethod } from "@/types/public/store";

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  CARD_TO_CARD: "کارت به کارت",
  CRYPTO: "ارز دیجیتال",
  EXTERNAL_GATEWAY: "درگاه پرداخت خارجی",
};

type PaymentMethodSelectorProps = {
  methods: PublicPaymentMethod[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export function PaymentMethodSelector({
  methods,
  selectedId,
  onSelect,
}: PaymentMethodSelectorProps) {
  if (methods.length === 0) {
    return <p className="text-sm text-red-600 dark:text-red-400">برای این فروشگاه روش پرداختی ثبت نشده است.</p>;
  }

  return (
    <div className="space-y-3">
      {methods.map((method) => (
        <label
          key={method.id}
          className={cn(
            "block cursor-pointer rounded-lg border p-4 transition-colors",
            selectedId === method.id
              ? "border-brand bg-brand-soft"
              : "border-border hover:border-border/80",
          )}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="payment_method"
              checked={selectedId === method.id}
              onChange={() => onSelect(method.id)}
              className="mt-1"
            />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-foreground">{method.display_name}</p>
              <p className="text-foreground-muted">{PAYMENT_TYPE_LABELS[method.type] ?? method.type.replace(/_/g, " ")}</p>
              {method.type === "CARD_TO_CARD" && (
                <div className="mt-2 space-y-1 text-foreground">
                  {method.card_number && <p>کارت: {method.card_number}</p>}
                  {method.owner_name && <p>نام: {method.owner_name}</p>}
                </div>
              )}
              {method.type === "CRYPTO" && method.wallet_address && (
                <p className="mt-2 break-all text-foreground">{method.wallet_address}</p>
              )}
              {method.type === "EXTERNAL_GATEWAY" && method.external_url && (
                <a
                  href={method.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-brand-deep hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  باز کردن لینک پرداخت
                </a>
              )}
              {method.instructions && (
                <p className="mt-2 text-foreground-muted">{method.instructions}</p>
              )}
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}
