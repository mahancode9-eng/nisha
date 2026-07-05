"use client";

import Link from "next/link";
import * as storeApi from "@/lib/api/seller/store";
import { paths } from "@/lib/auth/paths";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { StoreSettingsForm } from "@/components/seller/StoreSettingsForm";
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

  if (isLoading) return <LoadingState message="در حال بارگذاری فروشگاه..." />;
  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader description="پروفایل عمومی فروشگاه خود را مدیریت کنید" />
        <ErrorAlert message={error ?? "بارگذاری فروشگاه ممکن نشد"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="پروفایل عمومی فروشگاه خود را مدیریت کنید"
        action={
          <Link href={paths.store(data.slug)} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">مشاهده فروشگاه</Button>
          </Link>
        }
      />
      <StoreSettingsForm store={data} onSubmit={handleSubmit} />
    </div>
  );
}
