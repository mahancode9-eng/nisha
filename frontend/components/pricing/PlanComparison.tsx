import { Fragment } from "react";
import { cn } from "@/lib/cn";
import {
  PLAN_CATALOG,
  PLAN_COMPARISON,
  type ComparisonValue,
  type PlanCode,
} from "@/lib/pricing/planCatalog";

function Cell({ value }: { value: ComparisonValue }) {
  if (value === true) {
    return (
      <span className="font-semibold text-brand" role="img" aria-label="دارد">
        ✓
      </span>
    );
  }
  if (value === false || value === "—") {
    return (
      <span className="text-foreground-muted/60" role="img" aria-label="ندارد">
        —
      </span>
    );
  }
  return <span className="text-foreground">{value}</span>;
}

export function PlanComparison({ className }: { className?: string }) {
  const cols = PLAN_CATALOG.length + 1;
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border/70 bg-surface/90 shadow-sm",
        className,
      )}
    >
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
        <caption className="sr-only">مقایسه امکانات پلن‌ها</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky right-0 z-10 border-b border-border/70 bg-surface px-4 py-3 text-start font-medium text-foreground-muted"
            >
              امکانات
            </th>
            {PLAN_CATALOG.map((plan) => (
              <th
                key={plan.code}
                scope="col"
                className={cn(
                  "border-b border-border/70 px-3 py-3 text-center font-semibold text-foreground",
                  plan.is_recommended && "bg-brand/10",
                )}
              >
                {plan.name_fa}
                {plan.is_recommended && (
                  <span className="mt-1 block text-xs font-medium text-brand">پیشنهادی</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLAN_COMPARISON.map((section) => (
            <Fragment key={section.title}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={cols}
                  className="border-b border-border/70 bg-surface-muted px-4 py-2 text-start text-xs font-semibold text-foreground-muted"
                >
                  {section.title}
                </th>
              </tr>
              {section.rows.map((r) => (
                <tr key={r.label}>
                  <th
                    scope="row"
                    className="sticky right-0 z-10 border-b border-border/50 bg-surface px-4 py-3 text-start font-normal text-foreground"
                  >
                    {r.label}
                    {r.hint && (
                      <span className="mt-0.5 block text-xs text-foreground-muted">{r.hint}</span>
                    )}
                  </th>
                  {PLAN_CATALOG.map((plan) => (
                    <td
                      key={plan.code}
                      className={cn(
                        "border-b border-border/50 px-3 py-3 text-center",
                        plan.is_recommended && "bg-brand/5",
                      )}
                    >
                      <Cell value={r.values[plan.code as PlanCode]} />
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
