"use client";

import { useCallback, useState } from "react";
import * as categoriesApi from "@/lib/api/seller/categories";
import { ApiError } from "@/lib/api/errors";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";

export function ProductCategoryManager() {
  const toast = useToast();
  const { data, error, isLoading, refetch } = useSellerFetch(
    () => categoriesApi.listCategories(),
    [],
  );
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await categoriesApi.createCategory({ name: trimmed });
      setName("");
      toast.success("دسته‌بندی اضافه شد");
      await refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ذخیره دسته‌بندی ناموفق بود");
    } finally {
      setSaving(false);
    }
  }, [name, refetch, toast]);

  async function handleDelete(id: number) {
    try {
      await categoriesApi.deleteCategory(id);
      toast.success("دسته‌بندی حذف شد");
      await refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حذف دسته‌بندی ناموفق بود");
    }
  }

  if (isLoading) return <LoadingState message="در حال بارگذاری دسته‌بندی‌ها..." />;
  if (error) return <ErrorAlert message={error} />;

  const categories = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>دسته‌بندی محصولات</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground-muted">
          دسته‌بندی‌ها در ویترین فروشگاه برای فیلتر محصولات نمایش داده می‌شوند.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Input
            label="نام دسته جدید"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلا: کیف و کفش"
            className="flex-1"
          />
          <Button type="button" onClick={() => void handleCreate()} loading={saving} disabled={!name.trim()}>
            افزودن
          </Button>
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-foreground-muted">هنوز دسته‌بندی نساخته‌اید.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{category.name}</p>
                  <p className="text-xs text-foreground-muted" dir="ltr">
                    {category.slug}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => void handleDelete(category.id)}
                >
                  حذف
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
