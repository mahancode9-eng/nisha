"use client";

import { useRouter } from "next/navigation";
import * as productsApi from "@/lib/api/seller/products";
import { paths } from "@/lib/auth/paths";
import { useToast } from "@/contexts/ToastContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductForm } from "@/components/seller/ProductForm";
import type { ProductCreate } from "@/types/seller/product";

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();

  async function handleSubmit(data: ProductCreate | import("@/types/seller/product").ProductUpdate) {
    await productsApi.createProduct(data as ProductCreate);
    toast.success("محصول ایجاد شد");
    router.push(paths.seller.products);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="محصول جدید" description="یک محصول به فروشگاه خود اضافه کنید" size="page" />
      <ProductForm onSubmit={handleSubmit} submitLabel="ایجاد محصول" />
    </div>
  );
}
