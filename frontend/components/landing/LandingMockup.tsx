import { cn } from "@/lib/cn";

const miniStats = [
  { value: "85%", label: "پروفایل کامل شده" },
  { value: "24", label: "سفارش امروز" },
  { value: "4.9", label: "امتیاز فروشگاه" },
];

const statusRows = [
  { label: "لوگو", value: "تنظیم شده" },
  { label: "محصول", value: "آماده انتشار" },
  { label: "اعتماد", value: "نشان فعال" },
];

type LandingMockupProps = {
  className?: string;
};

export function LandingMockup({ className }: LandingMockupProps) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[36rem]", className)}>
      <div
        aria-hidden
        className="absolute -left-6 top-6 hidden h-24 w-24 rounded-full bg-brand/10 blur-3xl animate-float-slow md:block dark:bg-brand/15 dark:opacity-50"
      />
      <div
        aria-hidden
        className="absolute -right-8 top-24 hidden h-28 w-28 rounded-full bg-accent/10 blur-3xl animate-float-slower md:block dark:bg-fuchsia-500/10 dark:opacity-40"
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-1/2 hidden h-32 w-32 -translate-x-1/2 rounded-full bg-brand/10 blur-3xl animate-drift lg:block dark:bg-brand/10 dark:opacity-30"
      />

      <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,243,255,0.84))] p-4 shadow-[0_24px_80px_rgba(31,41,55,0.12)] dark:bg-[linear-gradient(180deg,rgba(10,14,26,0.96),rgba(4,7,15,0.98))] dark:shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
        <div className="rounded-[1.5rem] border border-border/70 bg-surface/92 p-4 shadow-sm backdrop-blur dark:bg-surface/80">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-sm font-bold text-brand ring-1 ring-brand/10 dark:bg-brand/15 dark:text-brand-deep dark:ring-brand/20">
                ن
              </div>
              <div>
                <p className="text-xs font-medium tracking-[0.22em] text-foreground-muted">پیش‌نمایش زنده</p>
                <p className="text-sm font-semibold text-foreground">فروشگاه نیشا</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-medium text-brand dark:border-brand/25 dark:bg-brand/15">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              85٪ آماده
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {miniStats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border/70 bg-surface px-4 py-3 shadow-sm transition-colors dark:bg-surface/80"
              >
                <p className="text-lg font-semibold text-foreground">{item.value}</p>
                <p className="mt-1 text-xs text-foreground-muted">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-[linear-gradient(180deg,rgba(124,58,237,0.1),rgba(255,255,255,0.75))] p-4 dark:bg-[linear-gradient(180deg,rgba(124,58,237,0.18),rgba(15,23,42,0.94))]">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full border border-border/70 bg-surface px-3 py-1 text-[11px] font-medium text-foreground-muted dark:bg-surface/80">
                    اولین محصول
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">کف مینیمال چرمی</h3>
                    <p className="mt-1 max-w-xs text-sm leading-6 text-foreground-muted">
                      تصویر، قیمت و توضیح کوتاه در یک کارت ساده. بدون شلوغی و آماده انتشار.
                    </p>
                  </div>
                </div>
                <div className="relative h-24 w-24 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,rgba(124,58,237,0.9),rgba(236,72,153,0.55))] shadow-inner ring-1 ring-white/10 dark:bg-[linear-gradient(135deg,rgba(168,85,247,0.92),rgba(244,114,182,0.62))]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.45),transparent_45%)]" />
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.36))] dark:bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.45))]" />
                  <div className="absolute inset-0 flex items-end p-3">
                    <span className="text-[0.65rem] font-semibold tracking-[0.32em] text-white/90">NEW</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-border/70 bg-surface px-4 py-3 shadow-sm dark:bg-surface/80">
                <div>
                  <p className="text-xs text-foreground-muted">قیمت پیشنهادی</p>
                  <p className="text-base font-semibold text-foreground">۲,۴۸۰,۰۰۰ تومان</p>
                </div>
                <div className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-sm">
                  انتشار
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[1.5rem] border border-border/70 bg-surface p-4 shadow-sm dark:bg-surface/80">
                <p className="text-xs font-medium tracking-[0.18em] text-foreground-muted">وضعیت فروشگاه</p>
                <div className="mt-3 space-y-2">
                  {statusRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-3 py-3 dark:bg-background/50"
                    >
                      <div>
                        <p className="text-xs text-foreground-muted">{row.label}</p>
                        <p className="text-sm font-medium text-foreground">{row.value}</p>
                      </div>
                      <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-surface p-4 shadow-sm dark:bg-surface/80">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium tracking-[0.18em] text-foreground-muted">گفت‌وگو</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">۳ پیام در انتظار پاسخ</p>
                  </div>
                  <div className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand dark:bg-brand/15">
                    فعال
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-surface-muted px-4 py-3 text-sm leading-6 text-foreground-muted dark:bg-surface/70">
                  «آیا این محصول امروز ارسال می‌شود؟»
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute -bottom-4 left-6 hidden rounded-full border border-border/70 bg-surface px-3 py-2 text-xs font-medium text-foreground-muted shadow-lg md:block animate-reveal-up dark:bg-surface/80"
        style={{ animationDelay: "180ms" }}
      >
        ذخیره خودکار
      </div>
      <div
        className="absolute -right-6 top-1/2 hidden -translate-y-1/2 rounded-full border border-border/70 bg-surface px-3 py-2 text-xs font-medium text-foreground-muted shadow-lg md:block animate-reveal-up dark:bg-surface/80"
        style={{ animationDelay: "260ms" }}
      >
        مناسب موبایل
      </div>
    </div>
  );
}
