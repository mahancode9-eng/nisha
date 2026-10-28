"use client";

import Link from "next/link";
import * as storeApi from "@/lib/api/seller/store";
import { paths } from "@/lib/auth/paths";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { StoreSettingsForm } from "@/components/seller/StoreSettingsForm";
import { AppearancePanel } from "@/components/theme/AppearancePanel";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { LoadingState } from "@/components/ui/LoadingState";
import type { StoreUpdate } from "@/types/seller/store";

export default function SellerStorePage() {
  const toast = useToast();
  const { data, error, isLoading, refetch } = useSellerFetch(() => storeApi.getStore(), []);

  async function handleSubmit(body: StoreUpdate) {
    await storeApi.updateStore(body);
    toast.success("تنظیمات فروشگاه ذخیره شد");
    await refetch();
  }

  if (isLoading) {
    return (
      <div className="page-stack">
        <PageHeader description="چی مشتری‌ها تو صفحه فروشگاهت می‌بینن" />
        <AppearancePanel />
        <LoadingState message="داره فروشگاه رو بارگذاری می‌کنه…" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="page-stack">
        <PageHeader description="چی مشتری‌ها تو صفحه فروشگاهت می‌بینن" />
        <AppearancePanel />
        <ErrorAlert message={error ?? "تنظیمات باز نشد. صفحه رو دوباره باز کن."} />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        description="چی مشتری‌ها تو صفحه فروشگاهت می‌بینن"
        action={
          <Link href={paths.store(data.slug)} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">دیدن فروشگاه</Button>
          </Link>
        }
      />
      <AppearancePanel />
      <StoreSettingsForm store={data} onSubmit={handleSubmit} />
    </div>
  );
}
