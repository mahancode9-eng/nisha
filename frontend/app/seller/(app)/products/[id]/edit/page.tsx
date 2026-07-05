"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import * as productsApi from "@/lib/api/seller/products";
import { paths } from "@/lib/auth/paths";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductForm } from "@/components/seller/ProductForm";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import type { ProductUpdate } from "@/types/seller/product";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params);
  const productId = parseInt(id, 10);
  const router = useRouter();
  const toast = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, error, isLoading } = useSellerFetch(
    () => productsApi.getProduct(productId),
    [productId],
  );

  async function handleSubmit(body: ProductUpdate) {
    await productsApi.updateProduct(productId, body);
    toast.success("محصول به‌روزرسانی شد");
    router.push(paths.seller.products);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await productsApi.deleteProduct(productId);
      toast.success("محصول حذف شد");
      router.push(paths.seller.products);
    } catch {
      toast.error("حذف محصول ممکن نشد");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (isLoading) return <LoadingState message="در حال بارگذاری محصول..." />;
  if (error || !data) {
    return (
      <EmptyState title="خطا" description={error ?? "محصول پیدا نشد"} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="ویرایش محصول" description={data.title} size="page" />
        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          حذف محصول
        </Button>
      </div>
      <ProductForm initial={data} onSubmit={handleSubmit} submitLabel="ذخیره تغییرات" />
      <ConfirmModal
        open={showDeleteModal}
        title="حذف محصول"
        message={`آیا از حذف «${data.title}» اطمینان دارید؟`}
        confirmLabel="حذف"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
