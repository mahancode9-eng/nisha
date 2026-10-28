"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import * as productsApi from "@/lib/api/seller/products";
import * as exportsApi from "@/lib/api/seller/exports";
import { paths } from "@/lib/auth/paths";
import { formatMoney } from "@/lib/format";
import { useToast } from "@/contexts/ToastContext";
import { useSellerEntitlements } from "@/hooks/useSellerEntitlements";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { ProductCategoryManager } from "@/components/seller/ProductCategoryManager";
import { UpgradeGate } from "@/components/seller/UpgradeGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { ApiError } from "@/lib/api/errors";

export default function SellerProductsPage() {
  const toast = useToast();
  const { entitlements } = useSellerEntitlements();
  const canExport = entitlements.excel_export;
  const maxProducts = entitlements.max_products;
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchProducts = useCallback(
    () => productsApi.listProducts({ page, page_size: 20 }),
    [page],
  );

  const { data, error, isLoading, refetch } = useSellerFetch(fetchProducts, [page]);

  async function handleDelete() {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await productsApi.deleteProduct(deleteId);
      toast.success("محصول حذف شد");
      setDeleteId(null);
      await refetch();
    } catch {
      toast.error("محصول حذف نشد. دوباره امتحان کن.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportsApi.downloadCsv(() => exportsApi.exportProductsCsv(), "products.csv");
      toast.success("فایل اکسل محصول‌ها دانلود شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "فایل خروجی ساخته نشد. دوباره امتحان کن.");
    } finally {
      setExporting(false);
    }
  }

  const items = data?.items ?? [];
  const isEmpty = !isLoading && !error && data && data.total === 0;
  const atProductLimit =
    typeof maxProducts === "number" && data != null && data.total >= maxProducts;

  return (
    <div className="space-y-4">
      <PageHeader
        description="محصول‌ها و دسته‌بندی‌های فروشگاهت"
        action={
          <div className="flex flex-wrap gap-2">
            {canExport && (
              <Button type="button" variant="secondary" size="sm" loading={exporting} onClick={() => void handleExport()}>
                خروجی Excel
              </Button>
            )}
            {atProductLimit ? (
              <Link href={paths.seller.subscription} className={buttonClassName({ size: "sm", variant: "secondary" })}>
                ارتقا برای محصول بیشتر
              </Link>
            ) : (
              <Link href={paths.seller.productNew} className={buttonClassName({ size: "sm" })}>
                افزودن محصول
              </Link>
            )}
          </div>
        }
      />

      {atProductLimit ? (
        <UpgradeGate
          compact
          title={`سقف ${maxProducts} محصول پلن فعلی پر شده`}
          description="با ارتقا به پلن بالاتر می‌تونی محصولات بیشتری اضافه کنی و فروشگاهت رو کامل‌تر کنی."
          ctaLabel="دیدن پلن‌ها و ارتقا"
        />
      ) : null}

      <ErrorAlert message={error ?? ""} />

      <Card>
        <CardContent className="px-4 py-4 sm:px-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <CardTitle className="text-base">محصولات</CardTitle>
              <ProductCategoryManager />
            </div>
            {data && data.total > 0 ? (
              <p className="text-xs text-foreground-muted">{data.total} کالا</p>
            ) : null}
          </div>

          {isLoading && <TableSkeleton rows={5} columns={6} />}

          {isEmpty && (
            <EmptyState
              title="هنوز محصولی نداری"
              description="اولین محصول رو اضافه کن؛ دسته‌بندی رو بعداً هم می‌شه تعیین کرد."
              action={
                <Link href={paths.seller.productNew} className={buttonClassName({ size: "sm" })}>
                  افزودن محصول
                </Link>
              }
            />
          )}

          {!isLoading && items.length > 0 && (
            <div className="space-y-3">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>عنوان</TableHeaderCell>
                    <TableHeaderCell>دسته‌بندی</TableHeaderCell>
                    <TableHeaderCell>قیمت</TableHeaderCell>
                    <TableHeaderCell>موجودی</TableHeaderCell>
                    <TableHeaderCell>وضعیت</TableHeaderCell>
                    <TableHeaderCell>عملیات</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.title}</TableCell>
                      <TableCell>{product.category?.name ?? "—"}</TableCell>
                      <TableCell>{formatMoney(product.price)}</TableCell>
                      <TableCell>{product.stock_quantity}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "success" : "neutral"}>
                          {product.is_active ? "فعال" : "غیرفعال"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link
                            href={paths.seller.productEdit(product.id)}
                            className={buttonClassName({ variant: "ghost", size: "sm" })}
                          >
                            ویرایش
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleteId(product.id)}
                          >
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data && (
                <PaginationControls
                  page={data.page}
                  totalPages={data.total_pages}
                  total={data.total}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        open={deleteId !== null}
        title="حذف محصول"
        message="محصول از فروشگاه حذف می‌شه و برنمی‌گرده."
        confirmLabel="حذف"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
