"use client";

import { useEffect, useState } from "react";
import * as settingsApi from "@/lib/api/admin/settings";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";

export default function AdminSettingsPage() {
  const toast = useToast();
  const { data, error, isLoading, refetch } = useSellerFetch(() => settingsApi.getPlatformSettings(), []);
  const [guestCheckoutEnabled, setGuestCheckoutEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setGuestCheckoutEnabled(data.guest_checkout_enabled);
    }
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await settingsApi.updatePlatformSettings({ guest_checkout_enabled: guestCheckoutEnabled });
      toast.success("تنظیمات پلتفرم ذخیره شد");
      await refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ذخیره تنظیمات ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <LoadingState message="در حال بارگذاری تنظیمات..." />;

  return (
    <div className="space-y-6">
      <PageHeader description="تنظیمات سراسری پلتفرم" />

      {error && <ErrorAlert message={error} />}

      <Card>
        <CardHeader>
          <CardTitle>خرید مهمان</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground-muted">
            با غیرفعال کردن این گزینه، هیچ فروشگاهی نمی‌تواند سفارش بدون ورود مشتری بپذیرد. فروشندگان همچنان
            می‌توانند این گزینه را برای فروشگاه خود خاموش کنند.
          </p>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={guestCheckoutEnabled}
              onChange={(e) => setGuestCheckoutEnabled(e.target.checked)}
              className="rounded border-border"
            />
            خرید مهمان در کل پلتفرم فعال است
          </label>
          <Button type="button" onClick={() => void handleSave()} loading={saving}>
            ذخیره تنظیمات
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
