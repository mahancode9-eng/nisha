import type { CheckoutPaymentInstructions } from "@/types/public/checkout";
import type { PublicPaymentMethod } from "@/types/public/store";

type PaymentInstructionsProps = {
  method: CheckoutPaymentInstructions | PublicPaymentMethod;
};

export function PaymentInstructions({ method }: PaymentInstructionsProps) {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100">
      <p className="font-semibold">راهنمای پرداخت - {method.display_name}</p>
      {method.type === "CARD_TO_CARD" && (
        <div className="mt-2 space-y-1">
          {method.card_number && <p>کارت مقصد: {method.card_number}</p>}
          {method.owner_name && <p>نام حساب: {method.owner_name}</p>}
        </div>
      )}
      {method.type === "CRYPTO" && method.wallet_address && (
        <p className="mt-2 break-all">کیف پول: {method.wallet_address}</p>
      )}
      {method.type === "EXTERNAL_GATEWAY" && method.external_url && (
        <a
          href={method.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-medium text-brand-deep hover:underline"
        >
          پرداخت از طریق لینک خارجی
        </a>
      )}
      {method.instructions && <p className="mt-2">{method.instructions}</p>}
    </div>
  );
}
