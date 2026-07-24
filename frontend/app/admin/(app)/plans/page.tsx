"use client";

import { useEffect, useState } from "react";
import * as plansApi from "@/lib/api/admin/subscriptions";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import type { SubscriptionPlan } from "@/types/subscription";

export default function AdminPlansPage() {
  const toast = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setPlans(await plansApi.listPlans());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "بارگذاری پلن‌ها ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function savePlan(plan: SubscriptionPlan) {
    setSavingId(plan.id);
    try {
      const updated = await plansApi.updatePlan(plan.id, {
        name_fa: plan.name_fa,
        monthly_price_toman: plan.monthly_price_toman,
        quarterly_price_toman: plan.quarterly_price_toman,
        yearly_price_toman: plan.yearly_price_toman,
        is_recommended: plan.is_recommended,
        sort_order: plan.sort_order,
        is_active: plan.is_active,
      });
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success("پلن ذخیره شد");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ذخیره پلن ناموفق بود");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <LoadingState message="در حال بارگذاری پلن‌ها..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="پلن‌های اشتراک" description="قیمت و وضعیت پلن‌های پلتفرم را مدیریت کنید" />
      {error && <ErrorAlert message={error} />}
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>
                {plan.name_fa} ({plan.code})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                label="نام فارسی"
                value={plan.name_fa}
                onChange={(e) =>
                  setPlans((prev) =>
                    prev.map((p) => (p.id === plan.id ? { ...p, name_fa: e.target.value } : p)),
                  )
                }
              />
              <Input
                label="قیمت ماهانه (تومان)"
                type="number"
                value={plan.monthly_price_toman}
                onChange={(e) =>
                  setPlans((prev) =>
                    prev.map((p) =>
                      p.id === plan.id
                        ? { ...p, monthly_price_toman: Number(e.target.value || 0) }
                        : p,
                    ),
                  )
                }
              />
              <Input
                label="قیمت سه‌ماهه (تومان)"
                type="number"
                value={plan.quarterly_price_toman}
                onChange={(e) =>
                  setPlans((prev) =>
                    prev.map((p) =>
                      p.id === plan.id
                        ? { ...p, quarterly_price_toman: Number(e.target.value || 0) }
                        : p,
                    ),
                  )
                }
              />
              <Input
                label="قیمت سالانه (تومان)"
                type="number"
                value={plan.yearly_price_toman}
                onChange={(e) =>
                  setPlans((prev) =>
                    prev.map((p) =>
                      p.id === plan.id
                        ? { ...p, yearly_price_toman: Number(e.target.value || 0) }
                        : p,
                    ),
                  )
                }
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={plan.is_recommended}
                  onChange={(e) =>
                    setPlans((prev) =>
                      prev.map((p) =>
                        p.id === plan.id ? { ...p, is_recommended: e.target.checked } : p,
                      ),
                    )
                  }
                />
                پیشنهادی
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={plan.is_active}
                  onChange={(e) =>
                    setPlans((prev) =>
                      prev.map((p) =>
                        p.id === plan.id ? { ...p, is_active: e.target.checked } : p,
                      ),
                    )
                  }
                />
                فعال
              </label>
              <Button
                type="button"
                loading={savingId === plan.id}
                onClick={() => void savePlan(plan)}
              >
                ذخیره
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
