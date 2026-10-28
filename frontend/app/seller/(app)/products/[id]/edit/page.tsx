"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
    toast.success("تغییرات ذخیره شد");
    router.push(paths.seller.products);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await productsApi.deleteProduct(productId);
      toast.success("محصول حذف شد");
      router.push(paths.seller.products);
    } catch {
      toast.error("محصول حذف نشد. دوباره امتحان کن.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (isLoading) return <LoadingState message="داره محصول رو بارگذاری می‌کنه…" />;
  if (error || !data) {
    return <EmptyState title="محصول باز نشد" description={error ?? "این محصول پیدا نشد؛ شاید حذف شده باشه."} />;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="ویرایش محصول"
        description={data.title}
        size="page"
        action={
          <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
            حذف محصول
          </Button>
        }
      />
      <ProductForm initial={data} onSubmit={handleSubmit} submitLabel="ذخیره تغییرات" />
      <ConfirmModal
        open={showDeleteModal}
        title="حذف محصول"
        message={`«${data.title}» حذف بشه؟ برنمی‌گرده.`}
        confirmLabel="حذف"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
