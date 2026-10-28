"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import * as categoriesApi from "@/lib/api/seller/categories";
import { ApiError } from "@/lib/api/errors";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { useToast } from "@/contexts/ToastContext";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

export function ProductCategoryManager() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, error, isLoading, refetch } = useSellerFetch(
    () => categoriesApi.listCategories(),
    [],
  );
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  const categories = data ?? [];
  const roots = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories],
  );

  const handleCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await categoriesApi.createCategory({
        name: trimmed,
        parent_id: parentId === "" ? null : parentId,
      });
      setName("");
      setParentId("");
      setOpen(false);
      toast.success(parentId === "" ? "دسته‌بندی اضافه شد" : "زیردسته اضافه شد");
      await refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "دسته‌بندی ذخیره نشد. دوباره امتحان کن.");
    } finally {
      setSaving(false);
    }
  }, [name, parentId, refetch, toast]);

  async function handleDelete(id: number) {
    try {
      await categoriesApi.deleteCategory(id);
      toast.success("دسته‌بندی حذف شد");
      await refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "دسته‌بندی حذف نشد. دوباره امتحان کن.");
    }
  }

  if (isLoading) return null;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap items-center gap-1.5">
        {roots.map((root) => {
          const children = categories.filter((c) => c.parent_id === root.id);
          return (
            <li key={root.id} className="contents">
              <span className="group inline-flex items-center gap-1 rounded-md border border-border bg-surface-muted/50 py-0.5 pe-0.5 ps-2 text-[11px] text-foreground">
                <span className="font-medium">{root.name}</span>
                <button
                  type="button"
                  onClick={() => void handleDelete(root.id)}
                  className="rounded px-1 text-foreground-muted opacity-60 transition hover:bg-surface hover:text-red-600 hover:opacity-100"
                  aria-label={`حذف ${root.name}`}
                >
                  ×
                </button>
              </span>
              {children.map((child) => (
                <span
                  key={child.id}
                  className="group inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-surface py-0.5 pe-0.5 ps-2 text-[11px] text-foreground-muted"
                >
                  <span>
                    {root.name} / {child.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDelete(child.id)}
                    className="rounded px-1 opacity-60 transition hover:bg-surface-muted hover:text-red-600 hover:opacity-100"
                    aria-label={`حذف ${child.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </li>
          );
        })}

        {open ? (
          <li className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
            <form
              className="inline-flex flex-wrap items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                void handleCreate();
              }}
            >
              <select
                value={parentId === "" ? "" : String(parentId)}
                onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : "")}
                className="h-6 rounded-md border border-border bg-surface px-1 text-[11px] text-foreground"
                aria-label="دسته والد"
              >
                <option value="">دسته اصلی</option>
                {roots.map((root) => (
                  <option key={root.id} value={root.id}>
                    زیردستهٔ {root.name}
                  </option>
                ))}
              </select>
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setName("");
                    setParentId("");
                    setOpen(false);
                  }
                }}
                placeholder="نام دسته"
                aria-label="نام دسته جدید"
                autoFocus
                disabled={saving}
                className="h-6 w-28 rounded-md border border-border bg-surface px-1.5 text-[11px] text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="h-6 rounded-md bg-brand px-2 text-[11px] font-medium text-white disabled:opacity-50"
              >
                {saving ? "…" : "ثبت"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setName("");
                  setParentId("");
                }}
                className="h-6 rounded-md px-2 text-[11px] text-foreground-muted"
              >
                انصراف
              </button>
            </form>
          </li>
        ) : (
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="inline-flex h-6 items-center gap-0.5 rounded-md border border-dashed border-border px-1.5 text-[11px] text-foreground-muted transition hover:border-brand hover:text-brand"
              aria-label="افزودن دسته‌بندی"
            >
              <span aria-hidden>+</span>
              دسته / زیردسته
            </button>
          </li>
        )}
      </ul>
      <p className="text-[11px] text-foreground-muted">
        دسته‌ها و زیردسته‌ها تو منوی فروشگاه به مشتری نشون داده می‌شه.
      </p>
    </div>
  );
}
