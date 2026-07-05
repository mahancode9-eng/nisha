"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import * as productsApi from "@/lib/api/seller/products";
import { paths } from "@/lib/auth/paths";
import { formatMoney } from "@/lib/format";
import { useToast } from "@/contexts/ToastContext";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

export default function SellerProductsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      toast.error("حذف محصول ناموفق بود");
    } finally {
      setDeleting(false);
    }
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        description="کاتالوگ خود را مدیریت کنید"
        action={
          <Link href={paths.seller.productNew}>
            <Button>افزودن محصول</Button>
          </Link>
        }
      />

      <ErrorAlert message={error ?? ""} />

      {isLoading && <TableSkeleton rows={6} columns={5} />}

      {!isLoading && !error && data && data.total === 0 && (
        <EmptyState
          title="هنوز محصولی ندارید"
          description="اولین محصول خود را اضافه کنید تا فروش را شروع کنید."
          action={
            <Link href={paths.seller.productNew}>
              <Button>افزودن محصول</Button>
            </Link>
          }
        />
      )}

      {!isLoading && items.length > 0 && (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>عنوان</TableHeaderCell>
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
                  <TableCell>{formatMoney(product.price)}</TableCell>
                  <TableCell>{product.stock_quantity}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "success" : "neutral"}>
                      {product.is_active ? "فعال" : "غیرفعال"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={paths.seller.productEdit(product.id)}>
                        <Button variant="ghost" size="sm">
                          ویرایش
                        </Button>
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
        </>
      )}

      <ConfirmModal
        open={deleteId !== null}
        title="حذف محصول"
        message="این عملیات قابل بازگشت نیست. محصول از فروشگاه شما حذف می‌شود."
        confirmLabel="حذف"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
