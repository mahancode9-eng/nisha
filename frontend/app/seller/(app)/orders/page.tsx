"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as ordersApi from "@/lib/api/seller/orders";
import * as exportsApi from "@/lib/api/seller/exports";
import { paths } from "@/lib/auth/paths";
import { useSellerEntitlements } from "@/hooks/useSellerEntitlements";
import { useSellerFetch } from "@/hooks/useSellerFetch";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api/errors";
import { downloadOrderInvoice } from "@/lib/orders/downloadInvoice";
import { useToast } from "@/contexts/ToastContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { Tabs } from "@/components/ui/Tabs";
import { ConfirmModal } from "@/components/seller/ConfirmModal";
import { OrderInboxCard } from "@/components/seller/OrderInboxCard";
import {
  actionToPatchStatus,
  isDestructiveAction,
  ORDER_ACTION_LABELS,
  type OrderAction,
} from "@/lib/seller/orderActions";
import { INBOX_STAGES, type InboxStage } from "@/lib/seller/orderInbox";

export default function SellerOrdersPage() {
  const router = useRouter();
  const toast = useToast();
  const { entitlements } = useSellerEntitlements();
  const canExport = entitlements.excel_export;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeStage, setActiveStage] = useState<InboxStage>("proof");
  const [defaultStageReady, setDefaultStageReady] = useState(false);
  const [stageCounts, setStageCounts] = useState<Partial<Record<InboxStage, number>>>({});
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [chatLoadingId, setChatLoadingId] = useState<number | null>(null);
  const [actionOrderId, setActionOrderId] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    orderId: number;
    action: OrderAction;
  } | null>(null);
  const [exporting, setExporting] = useState(false);

  const activeMeta = useMemo(
    () => INBOX_STAGES.find((stage) => stage.key === activeStage) ?? INBOX_STAGES[0]!,
    [activeStage],
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeStage]);

  const refreshCounts = useCallback(async () => {
    const results = await Promise.all(
      INBOX_STAGES.map(async (stage) => {
        const res = await ordersApi.listOrders({
          statuses: stage.statuses,
          search: debouncedSearch || undefined,
          page: 1,
          page_size: 1,
        });
        return [stage.key, res.total] as const;
      }),
    );
    const next: Partial<Record<InboxStage, number>> = {};
    for (const [key, total] of results) next[key] = total;
    setStageCounts(next);
    return next;
  }, [debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const counts = await refreshCounts();
        if (cancelled || defaultStageReady) return;
        const preferred: InboxStage[] = ["proof", "prep", "ship"];
        const next = preferred.find((key) => (counts[key] ?? 0) > 0) ?? "proof";
        setActiveStage(next);
        setDefaultStageReady(true);
      } catch {
        if (!cancelled) setDefaultStageReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshCounts, defaultStageReady]);

  useEffect(() => {
    if (!defaultStageReady) return;
    void refreshCounts().catch(() => undefined);
  }, [debouncedSearch, defaultStageReady, refreshCounts]);

  const fetchOrders = useCallback(
    () =>
      ordersApi.listOrders({
        statuses: activeMeta.statuses,
        search: debouncedSearch || undefined,
        page,
        page_size: 20,
      }),
    [activeMeta.statuses, debouncedSearch, page],
  );

  const { data, error, isLoading, refetch } = useSellerFetch(fetchOrders, [
    activeMeta.statuses,
    debouncedSearch,
    page,
  ]);

  const items = data?.items ?? [];

  async function executeAction(orderId: number, action: OrderAction) {
    setActionOrderId(orderId);
    try {
      if (action === "confirm_payment") {
        await ordersApi.confirmPayment(orderId);
        toast.success("پرداخت تایید شد");
      } else if (action === "reject_payment") {
        await ordersApi.rejectPayment(orderId);
        toast.success("پرداخت رد شد");
      } else {
        const status = actionToPatchStatus(action);
        if (!status) return;
        await ordersApi.patchOrderStatus(orderId, { status });
        toast.success(ORDER_ACTION_LABELS[action]);
      }
      await Promise.all([refetch(), refreshCounts()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "وضعیت سفارش تغییر نکرد. دوباره امتحان کن.");
    } finally {
      setActionOrderId(null);
      setPendingAction(null);
    }
  }

  function handleAction(orderId: number, action: OrderAction) {
    if (action === "confirm_payment" || isDestructiveAction(action)) {
      setPendingAction({ orderId, action });
      return;
    }
    void executeAction(orderId, action);
  }

  async function handleChat(order: (typeof items)[number]) {
    if (order.conversation_id) {
      router.push(paths.seller.conversationDetail(order.conversation_id));
      return;
    }
    setChatLoadingId(order.id);
    try {
      const created = await ordersApi.openOrderConversation(order.id);
      router.push(paths.seller.conversationDetail(created.conversation_id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "گفتگو باز نشد. دوباره امتحان کن.");
    } finally {
      setChatLoadingId(null);
    }
  }

  async function handleDownload(orderId: number, invoiceCode: string) {
    setDownloadingId(orderId);
    try {
      await downloadOrderInvoice(() => ordersApi.downloadInvoice(orderId), invoiceCode);
      toast.success("فاکتور دانلود شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "فاکتور دانلود نشد. دوباره امتحان کن.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportsApi.downloadCsv(() => exportsApi.exportOrdersCsv(), "orders.csv");
      toast.success("فایل اکسل سفارش‌ها دانلود شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "فایل خروجی ساخته نشد. دوباره امتحان کن.");
    } finally {
      setExporting(false);
    }
  }

  const pendingConfirmTitle =
    pendingAction?.action === "confirm_payment"
      ? "تایید پرداخت"
      : pendingAction?.action === "reject_payment"
        ? "رد پرداخت"
        : "لغو سفارش";
  const pendingConfirmMessage =
    pendingAction?.action === "confirm_payment"
      ? "مطمئنی پرداخت این سفارش تایید بشه؟"
      : pendingAction?.action === "reject_payment"
        ? "به مشتری خبر می‌دیم که دوباره پرداخت کنه و موجودی کالا برمی‌گرده."
        : "سفارش لغو می‌شه و موجودی کالاها به انبار برمی‌گرده.";

  return (
    <div className="space-y-6">
      <PageHeader
        description="از رسید تا ارسال، کار بعدی هر سفارش رو همین‌جا ببین"
        action={
          canExport ? (
            <Button type="button" variant="secondary" loading={exporting} onClick={() => void handleExport()}>
              خروجی Excel
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="جستجو"
            placeholder="کد فاکتور، نام خریدار یا تلفن"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs
        items={INBOX_STAGES.map((stage) => ({
          key: stage.key,
          label:
            stageCounts[stage.key] !== undefined
              ? `${stage.label} (${stageCounts[stage.key]})`
              : stage.label,
        }))}
        activeKey={activeStage}
        onChange={(key) => setActiveStage(key as InboxStage)}
      >
        {isLoading && <TableSkeleton rows={4} columns={3} />}

        <ErrorAlert message={!isLoading && error ? error : ""} />

        {!isLoading && !error && data && data.total === 0 && (
          <EmptyState title={activeMeta.emptyTitle} description={activeMeta.emptyDescription} />
        )}

        {!isLoading && items.length > 0 && (
          <>
            <div className="space-y-3">
              {items.map((order) => (
                <OrderInboxCard
                  key={order.id}
                  order={order}
                  actionLoading={actionOrderId === order.id}
                  chatLoading={chatLoadingId === order.id}
                  downloadLoading={downloadingId === order.id}
                  onAction={(action) => handleAction(order.id, action)}
                  onChat={() => void handleChat(order)}
                  onDownload={() => void handleDownload(order.id, order.invoice_code)}
                />
              ))}
            </div>
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
      </Tabs>

      <ConfirmModal
        open={pendingAction !== null}
        title={pendingConfirmTitle}
        message={pendingConfirmMessage}
        confirmLabel={pendingAction ? ORDER_ACTION_LABELS[pendingAction.action] : "تایید"}
        confirmVariant={pendingAction?.action === "confirm_payment" ? "primary" : "danger"}
        loading={actionOrderId !== null}
        onConfirm={() =>
          pendingAction && void executeAction(pendingAction.orderId, pendingAction.action)
        }
        onClose={() => setPendingAction(null)}
      />
    </div>
  );
}
