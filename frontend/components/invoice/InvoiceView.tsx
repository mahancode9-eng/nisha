import { formatDateTime, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import type { OrderTrackResponse } from "@/types/public/order";

export function InvoiceView({ order }: { order: OrderTrackResponse }) {
  return (
    <div className="invoice-print space-y-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
      <header className="border-b border-border pb-4">
        <p className="text-sm text-foreground-muted">فاکتور</p>
        <h1 className="text-2xl font-bold text-foreground">{order.store.name}</h1>
        <p className="mt-1 font-mono text-sm">{order.invoice_code}</p>
        <p className="text-sm text-foreground-muted">{formatDateTime(order.created_at)}</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <h2 className="text-xs font-semibold text-foreground-muted">فرستنده</h2>
          <p className="mt-1 font-medium">{order.store.name}</p>
          {order.store.phone && <p className="text-sm">{order.store.phone}</p>}
          {order.store.support_contact && <p className="text-sm">{order.store.support_contact}</p>}
        </section>
        <section>
          <h2 className="text-xs font-semibold text-foreground-muted">صورتحساب به</h2>
          <p className="mt-1 font-medium">{order.buyer_name}</p>
          <p className="text-sm">{order.buyer_phone}</p>
          <p className="text-sm whitespace-pre-wrap">{order.buyer_address}</p>
        </section>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground-muted">وضعیت:</span>
        <StatusBadge status={order.status} />
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>محصول</TableHeaderCell>
            <TableHeaderCell>تعداد</TableHeaderCell>
            <TableHeaderCell>قیمت واحد</TableHeaderCell>
            <TableHeaderCell>جمع</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {order.items.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell>{item.product_title}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{formatMoney(item.unit_price)}</TableCell>
              <TableCell>{formatMoney(item.total_price)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end border-t border-border pt-4">
        <div className="text-start">
          <p className="text-sm text-foreground-muted">
            جمع جزء: {formatMoney(order.subtotal_amount)}
          </p>
          <p className="text-lg font-bold">مجموع: {formatMoney(order.total_amount)}</p>
        </div>
      </div>

      <section className="rounded-lg bg-surface-muted p-4 text-sm">
        <h2 className="font-semibold text-foreground">روش پرداخت</h2>
        <p className="mt-1">{order.payment_method.display_name}</p>
        {order.payment_method.type === "CARD_TO_CARD" && order.payment_method.card_number && (
          <p>کارت: {order.payment_method.card_number}</p>
        )}
        {order.payment_method.type === "CRYPTO" && order.payment_method.wallet_address && (
          <p className="break-all">کیف پول: {order.payment_method.wallet_address}</p>
        )}
        {order.payment_method.instructions && (
          <p className="mt-2 text-foreground-muted">{order.payment_method.instructions}</p>
        )}
      </section>
    </div>
  );
}
