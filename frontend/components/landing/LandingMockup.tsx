import { cn } from "@/lib/cn";

const products = [
  { name: "کفش روزمره", price: "۲٬۴۸۰٬۰۰۰", tone: "from-stone-200 to-stone-100 dark:from-stone-700 dark:to-stone-800" },
  { name: "کیف چرمی", price: "۱٬۱۹۰٬۰۰۰", tone: "from-amber-100 to-orange-50 dark:from-amber-900/40 dark:to-stone-800" },
  { name: "ساعت مینیمال", price: "۳٬۲۵۰٬۰۰۰", tone: "from-slate-200 to-zinc-100 dark:from-slate-700 dark:to-zinc-800" },
];

type LandingMockupProps = {
  className?: string;
};

/** Minimal buyer-facing storefront mock for the landing hero (guests). */
export function LandingMockup({ className }: LandingMockupProps) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[22rem]", className)}>
      <div
        aria-hidden
        className="absolute -left-4 top-8 hidden h-16 w-16 rounded-full bg-brand/10 blur-3xl md:block"
      />
      <div
        aria-hidden
        className="absolute -right-2 bottom-12 hidden h-20 w-20 rounded-full bg-accent/10 blur-3xl md:block"
      />

      {/* Phone frame */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-background shadow-[0_24px_80px_rgba(31,41,55,0.14)] dark:shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
        <div className="flex items-center justify-center border-b border-border/50 bg-surface/90 py-2">
          <span className="h-1.5 w-16 rounded-full bg-foreground/15" />
        </div>

        {/* Soft cover */}
        <div className="relative h-24 bg-[linear-gradient(135deg,#e8e4dc_0%,#d4cfc4_45%,#c5b8a8_100%)] dark:bg-[linear-gradient(135deg,#3f3a34_0%,#2a2622_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.35),transparent_55%)]" />
        </div>

        <div className="relative -mt-8 px-4 pb-5">
          <div className="flex items-end gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-background bg-surface text-lg font-bold text-foreground shadow-sm">
              آ
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p className="truncate text-base font-semibold text-foreground">آتیه استور</p>
              <p className="text-xs text-foreground-muted">پوشاک و اکسسوری</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {products.map((product) => (
              <div
                key={product.name}
                className="overflow-hidden rounded-xl border border-border/60 bg-surface"
              >
                <div className={cn("h-16 bg-gradient-to-br", product.tone)} />
                <div className="space-y-0.5 p-2">
                  <p className="truncate text-[11px] font-medium text-foreground">{product.name}</p>
                  <p className="text-[10px] text-foreground-muted">{product.price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 bg-surface-muted/60 px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm">
              💳
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">پرداخت کارت‌به‌کارت</p>
              <p className="truncate text-[11px] text-foreground-muted">واریز + آپلود رسید</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
