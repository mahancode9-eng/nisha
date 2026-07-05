import { cn } from "@/lib/cn";

const nextSteps = [
  { label: "فروشگاه", value: "تکمیل شده" },
  { label: "اطلاعات تماس", value: "تکمیل شده" },
  { label: "اولین محصول", value: "در انتظار" },
];

type LandingMockupProps = {
  className?: string;
};

export function LandingMockup({ className }: LandingMockupProps) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[34rem]", className)}>
      <div
        aria-hidden
        className="absolute -left-6 top-6 hidden h-20 w-20 rounded-full bg-brand/10 blur-3xl animate-float-slow md:block dark:bg-brand/15 dark:opacity-45"
      />
      <div
        aria-hidden
        className="absolute -right-6 bottom-10 hidden h-24 w-24 rounded-full bg-accent/10 blur-3xl animate-float-slower md:block dark:bg-fuchsia-500/10 dark:opacity-35"
      />

      <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,243,255,0.82))] p-4 shadow-[0_24px_80px_rgba(31,41,55,0.12)] dark:bg-[linear-gradient(180deg,rgba(10,14,26,0.96),rgba(4,7,15,0.98))] dark:shadow-[0_24px_80px_rgba(2,6,23,0.56)]">
        <div className="rounded-[1.6rem] border border-border/70 bg-surface/95 p-4 shadow-sm backdrop-blur dark:bg-surface/80">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-sm font-bold text-brand ring-1 ring-brand/10 dark:bg-brand/15 dark:text-brand-deep dark:ring-brand/20">
                ن
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-[0.22em] text-foreground-muted">پیش‌نمایش زنده</p>
                <p className="truncate text-sm font-semibold text-foreground">فروشگاه نیشا</p>
              </div>
            </div>
            <div className="shrink-0 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-medium text-brand dark:border-brand/25 dark:bg-brand/15">
              آماده انتشار
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/70 p-4 dark:bg-background/35">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-3">
                  <span className="inline-flex rounded-full border border-border/70 bg-surface px-3 py-1 text-[11px] font-medium text-foreground-muted dark:bg-surface/80">
                    اولین محصول
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">کف چرمی مینیمال</h3>
                    <p className="mt-1 max-w-xs text-sm leading-6 text-foreground-muted">
                      یک تصویر، یک توضیح کوتاه و یک قیمت روشن. برای شروع، همین کافی است.
                    </p>
                  </div>
                </div>

                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.92),rgba(236,72,153,0.55))] shadow-inner dark:bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(244,114,182,0.62))]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.45),transparent_45%)]" />
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.34))] dark:bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.45))]" />
                  <div className="absolute inset-0 flex items-end p-3">
                    <span className="text-[0.65rem] font-semibold tracking-[0.32em] text-white/90">جدید</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-foreground-muted">قیمت پیشنهادی</p>
                  <p className="text-base font-semibold text-foreground">۲٬۴۸۰٬۰۰۰ تومان</p>
                </div>
                <div className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-sm">
                  انتشار محصول
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-brand to-fuchsia-500" />
              </div>
              <p className="mt-2 text-xs text-foreground-muted">ذخیره خودکار روشن است</p>
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-surface/90 p-4 shadow-sm dark:bg-surface/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium tracking-[0.18em] text-foreground-muted">گام بعدی</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">پروفایل را کامل کنید</p>
                </div>
                <div className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand dark:bg-brand/15">
                  ۲ از ۳
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {nextSteps.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-3 py-3 dark:bg-background/50"
                  >
                    <div>
                      <p className="text-xs text-foreground-muted">{item.label}</p>
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        item.value === "تکمیل شده" ? "bg-emerald-500" : "bg-brand",
                      )}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm leading-6 text-foreground-muted dark:bg-background/40">
                هر زمان خواستید می‌توانید ادامه دهید. همه چیز خودکار ذخیره می‌شود.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
